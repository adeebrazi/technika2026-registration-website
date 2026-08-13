const { google } = require('googleapis');
const SheetsQueue = require('../models/SheetsQueue');

let sheetsClient = global.mockSheetsClient || null;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;

const isConfigured = 
  global.mockSheetsClient ? true : (
  serviceEmail && 
  privateKey && 
  spreadsheetId &&
  !serviceEmail.includes('dummy') &&
  !privateKey.includes('dummy') &&
  !spreadsheetId.includes('dummy')
  );

if (isConfigured && !global.mockSheetsClient) {
  try {
    let cleanKey = privateKey;
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      cleanKey = cleanKey.substring(1, cleanKey.length - 1);
    }
    const auth = new google.auth.JWT(
      serviceEmail,
      null,
      cleanKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('Google Sheets service initialized successfully.');
  } catch (error) {
    console.error('Google Sheets auth initialization failed:', error.message);
  }
} else if (!isConfigured) {
  console.warn('WARNING: Google Sheets API is not configured. Sync tasks will be mocked for local testing.');
}

/**
 * Queue a participant sync task
 */
const queueParticipantSync = async (user) => {
  try {
    const payload = {
      registrationId: user.registrationId,
      name: user.name,
      age: user.age,
      gender: user.gender,
      email: user.email,
      whatsapp: user.whatsapp,
      institution: user.institution,
      course: user.course,
      semester: user.semester,
      utr: user.paymentUTR,
      screenshotUrl: user.paymentScreenshotUrl,
      registeredAt: user.createdAt,
    };

    const task = new SheetsQueue({
      registrationId: user.registrationId,
      type: 'PARTICIPANT',
      data: payload,
    });
    await task.save();
    
    await processSingleTask(task);
  } catch (error) {
    console.error('Failed to queue participant sync:', error.message);
  }
};

/**
 * Queue a registration (event enrollment) sync task
 */
const queueRegistrationSync = async (registration, event) => {
  try {
    const payload = {
      registrationId: registration.registrationId,
      eventId: registration.eventId,
      eventName: event.name,
      registrationType: registration.registrationType,
      teamId: registration.teamId || 'N/A',
      leaderId: registration.registrationType === 'TEAM' ? (registration.teamId ? 'Invite-only' : 'N/A') : 'N/A',
    };

    const task = new SheetsQueue({
      registrationId: registration.registrationId,
      type: 'REGISTRATION',
      data: payload,
    });
    await task.save();

    await processSingleTask(task);
  } catch (error) {
    console.error('Failed to queue registration sync:', error.message);
  }
};

const creatingSheets = {};

/**
 * Helper to get dynamic headers based on events
 */
const getDynamicHeaders = async () => {
  const headers = [
    'Registration ID', 
    'Name', 
    'Email', 
    'WhatsApp', 
    'Institution', 
    'Course', 
    'Semester', 
    'Age', 
    'Gender', 
    'Payment UTR', 
    'Screenshot URL', 
    'Registered At'
  ];
  
  const Event = require('../models/Event');
  const events = await Event.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  for (const ev of events) {
    headers.push(ev.name);
    if (ev.teamAllowed) {
      headers.push(`${ev.name} Team Code`);
    }
  }
  return headers;
};

/**
 * Helper to ensure a sheet tab exists in Google Sheets and headers are up to date
 */
const ensureSheetExists = async (sheetName) => {
  if (creatingSheets[sheetName]) {
    await creatingSheets[sheetName];
    return;
  }

  creatingSheets[sheetName] = (async () => {
    try {
      const metadata = await sheetsClient.spreadsheets.get({
        spreadsheetId
      });
      const sheetTitles = (metadata.data.sheets || []).map(s => s.properties.title);
      let sheetId = null;
      
      if (!sheetTitles.includes(sheetName)) {
        console.log(`Sheet "${sheetName}" not found. Creating programmatically...`);
        const addRes = await sheetsClient.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName
                  }
                }
              }
            ]
          }
        });
        sheetId = addRes.data.replies[0].addSheet.properties.sheetId;
        console.log(`Sheet "${sheetName}" created successfully.`);
      } else {
        const sheetObj = (metadata.data.sheets || []).find(s => s.properties.title === sheetName);
        sheetId = sheetObj.properties.sheetId;
      }

      // Always write the headers so it stays updated if new events are added
      const headers = await getDynamicHeaders();
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!1:1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [headers] }
      });
      
      // Programmatically add Checkbox (Data Validation) to event columns
      const checkboxColumns = [];
      for (let i = 12; i < headers.length; i++) {
        if (!headers[i].endsWith('Team Code')) {
          checkboxColumns.push(i);
        }
      }
      
      if (checkboxColumns.length > 0 && sheetId !== null) {
        const requests = checkboxColumns.map(colIndex => ({
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1, // Start below headers (row 2)
              endRowIndex: 1000, // Apply to a generous amount of rows
              startColumnIndex: colIndex,
              endColumnIndex: colIndex + 1
            },
            rule: {
              condition: { type: 'BOOLEAN' },
              showCustomUi: true
            }
          }
        }));
        
        await sheetsClient.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: { requests }
        });
      }
    } catch (err) {
      console.error(`Error checking/creating sheet "${sheetName}":`, err.message);
    }
  })();

  try {
    await creatingSheets[sheetName];
  } finally {
    delete creatingSheets[sheetName];
  }
};

// Helper function to turn a column index (0-based) into a letter (e.g. 0 -> A, 25 -> Z, 26 -> AA)
const colIndexToLetter = (index) => {
  let temp, letter = '';
  while (index >= 0) {
    temp = index % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = (index - temp) / 26 - 1;
  }
  return letter;
};

/**
 * Process a single queue task using the unified horizontal Registrations sheet
 */
const processSingleTask = async (task) => {
  if (!isConfigured || !sheetsClient) {
    task.status = 'SUCCESS';
    task.processedAt = new Date();
    await task.save();
    console.log(`[MOCK SYNC] Successfully synced ${task.type} for ID: ${task.registrationId} to Google Sheets`);
    return;
  }

  try {
    await ensureSheetExists('Registrations');

    // Fetch the sheet to find headers and the participant row
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:ZZ' // Fetch a wide range to get all dynamic columns
    });
    const rows = response.data.values || [];
    const headers = rows[0] || [];

    // Find the participant's existing row (1-indexed)
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === task.registrationId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (task.type === 'PARTICIPANT') {
      const d = task.data;
      const registeredAtStr = new Date(d.registeredAt).toLocaleString();
      
      const profileData = [
        d.registrationId,
        d.name,
        d.email,
        d.whatsapp,
        d.institution,
        d.course,
        d.semester,
        d.age,
        d.gender,
        d.utr,
        d.screenshotUrl,
        registeredAtStr
      ];

      if (rowIndex !== -1) {
        // Update only the fixed profile columns (A to L)
        await sheetsClient.spreadsheets.values.update({
          spreadsheetId,
          range: `Registrations!A${rowIndex}:L${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [profileData] }
        });
        console.log(`[SYNC UPDATE] Updated profile fields in row ${rowIndex} for ID: ${task.registrationId}`);
      } else {
        // Append a new row with just profile data. Event cells will be left blank.
        await sheetsClient.spreadsheets.values.append({
          spreadsheetId,
          range: 'Registrations!A:L',
          valueInputOption: 'USER_ENTERED',
          resource: { values: [profileData] }
        });
        console.log(`[SYNC APPEND] Appended new Participant row for ID: ${task.registrationId}`);
      }
    } else if (task.type === 'REGISTRATION') {
      const d = task.data;
      
      // If the participant row does not exist, we should really sync their profile first.
      // But typically PARTICIPANT tasks are queued before REGISTRATION tasks.
      if (rowIndex !== -1) {
        const eventNameIndex = headers.indexOf(d.eventName);
        
        if (eventNameIndex !== -1) {
          const colLetter = colIndexToLetter(eventNameIndex);
          const cellRange = `Registrations!${colLetter}${rowIndex}`;
          
          // Write TRUE to the event column
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range: cellRange,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [['TRUE']] }
          });
          
          // If team registration, write team code in the next column
          if (d.registrationType === 'TEAM' && d.teamId && d.teamId !== 'N/A') {
            const teamColIndex = headers.indexOf(`${d.eventName} Team Code`);
            if (teamColIndex !== -1) {
              const teamColLetter = colIndexToLetter(teamColIndex);
              await sheetsClient.spreadsheets.values.update({
                spreadsheetId,
                range: `Registrations!${teamColLetter}${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: [[d.teamId]] }
              });
            }
          }
          console.log(`[SYNC UPDATE] Marked TRUE for event "${d.eventName}" on row ${rowIndex} for ID: ${task.registrationId}`);
        } else {
          console.warn(`[SYNC WARNING] Header column not found for event: ${d.eventName}`);
        }
      } else {
        console.warn(`[SYNC WARNING] Could not find row for Registration ID ${task.registrationId} to add event checkmark. Requeuing task.`);
        throw new Error('Participant row not found in Sheets yet. Will retry later.');
      }
    }

    task.status = 'SUCCESS';
    task.processedAt = new Date();
    task.errorMessage = null;
    await task.save();
    console.log(`[SYNC] Synced ${task.type} for ID: ${task.registrationId} to Google Sheets`);
  } catch (error) {
    task.status = 'FAILED';
    task.retryCount += 1;
    task.errorMessage = error.message;
    await task.save();
    console.error(`[SYNC FAILED] Error syncing ${task.type} for ID: ${task.registrationId}:`, error.message);
    throw error;
  }
};

/**
 * Sync changes from Google Sheets back to MongoDB (2-way sync)
 */
const syncSheetsToMongo = async () => {
  if (!isConfigured || !sheetsClient) return;

  try {
    console.log('[SHEETS SYNC] Polling Google Sheets for updates...');
    const User = require('../models/User');

    await ensureSheetExists('Registrations');

    // Only fetch the fixed profile columns (A to K) to look for profile modifications
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A2:K',
    });

    const rows = response.data.values || [];
    for (const row of rows) {
      if (!row || row.length < 1) continue;

      const [
        registrationId,
        name,
        email,
        whatsapp,
        institution,
        course,
        semester,
        ageStr,
        gender,
        utr
      ] = row;

      if (!registrationId) continue;

      const cleanRegId = registrationId.trim().toUpperCase();
      const user = await User.findOne({ registrationId: cleanRegId });
      
      if (user) {
        let needsUpdate = false;

        if (name && user.name !== name.trim()) {
          user.name = name.trim();
          needsUpdate = true;
        }
        if (email && user.email !== email.trim().toLowerCase()) {
          user.email = email.trim().toLowerCase();
          needsUpdate = true;
        }
        if (whatsapp && user.whatsapp !== whatsapp.trim()) {
          user.whatsapp = whatsapp.trim();
          needsUpdate = true;
        }
        if (institution && user.institution !== institution.trim()) {
          user.institution = institution.trim();
          needsUpdate = true;
        }
        if (course && user.course !== course.trim()) {
          user.course = course.trim();
          needsUpdate = true;
        }
        if (semester && user.semester !== semester.trim()) {
          user.semester = semester.trim();
          needsUpdate = true;
        }
        const parsedAge = parseInt(ageStr);
        if (!isNaN(parsedAge) && user.age !== parsedAge) {
          user.age = parsedAge;
          needsUpdate = true;
        }
        if (gender && user.gender !== gender.trim()) {
          user.gender = gender.trim();
          needsUpdate = true;
        }
        if (utr && user.paymentUTR !== utr.trim()) {
          user.paymentUTR = utr.trim();
          needsUpdate = true;
        }

        if (needsUpdate) {
          await user.save();
          console.log(`[SHEETS SYNC] Updated User ${cleanRegId} in MongoDB from Sheets changes.`);
        }
      }
    }
  } catch (error) {
    console.error('[SHEETS SYNC ERROR] Failed to sync sheets to MongoDB:', error.message);
  }
};

/**
 * Periodically process failed or pending sync tasks in the queue (retries)
 */
const startQueueWorker = () => {
  if (process.env.VERCEL) {
    console.log('[SHEETS WORKER] Running in Vercel environment. Background intervals and automatic database reconciliation are disabled.');
    return;
  }

  // On startup, reset all failed tasks back to PENDING so they are retried
  SheetsQueue.updateMany(
    { status: 'FAILED' },
    { status: 'PENDING', retryCount: 0, errorMessage: null }
  ).then(res => {
    if (res.modifiedCount > 0) {
      console.log(`[SHEETS WORKER] Reset ${res.modifiedCount} failed sync tasks back to PENDING for retry.`);
    }
  }).catch(err => {
    console.error('[SHEETS WORKER] Failed to reset failed tasks:', err.message);
  });

  // Reconcile database to SheetsQueue on boot
  setTimeout(async () => {
    try {
      console.log('[SHEETS WORKER] Starting database sync reconciliation...');
      const User = require('../models/User');
      const Registration = require('../models/Registration');
      const Event = require('../models/Event');

      const users = await User.find({});
      for (const u of users) {
        const existingTask = await SheetsQueue.findOne({ registrationId: u.registrationId, type: 'PARTICIPANT' });
        if (!existingTask) {
          await queueParticipantSync(u);
        } else {
          const task = new SheetsQueue({
            registrationId: u.registrationId,
            type: 'PARTICIPANT',
            data: {
              registrationId: u.registrationId,
              name: u.name,
              age: u.age,
              gender: u.gender,
              email: u.email,
              whatsapp: u.whatsapp,
              institution: u.institution,
              course: u.course,
              semester: u.semester,
              utr: u.paymentUTR,
              screenshotUrl: u.paymentScreenshotUrl,
              registeredAt: u.createdAt
            }
          });
          await task.save();
          processSingleTask(task).catch(err => {});
        }
      }

      const regs = await Registration.find({ status: 'CONFIRMED' });
      for (const r of regs) {
        const ev = await Event.findOne({ eventId: r.eventId });
        if (ev) {
          const existingTask = await SheetsQueue.findOne({ 
            registrationId: r.registrationId, 
            type: 'REGISTRATION', 
            'data.eventId': r.eventId 
          });
          if (!existingTask) {
            await queueRegistrationSync(r, ev);
          } else {
            existingTask.status = 'PENDING';
            existingTask.retryCount = 0;
            await existingTask.save();
            await processSingleTask(existingTask).catch(err => {
              console.error(`[SHEETS WORKER] Registration sync failed for ID: ${existingTask.registrationId}:`, err.message);
            });
          }
        }
      }
      console.log(`[SHEETS WORKER] Reconciliation complete. Checked ${users.length} users and ${regs.length} registrations.`);
      
      await syncSheetsToMongo();
    } catch (err) {
      console.error('[SHEETS WORKER] Database reconciliation failed:', err.message);
    }
  }, 5000);

  // Run every 2 minutes
  setInterval(async () => {
    try {
      const pendingTasks = await SheetsQueue.find({
        status: { $in: ['PENDING', 'FAILED'] },
        retryCount: { $lt: 5 },
      }).limit(15);

      if (pendingTasks.length > 0) {
        console.log(`Google Sheets worker found ${pendingTasks.length} pending sync tasks.`);
        for (const task of pendingTasks) {
          try {
            await processSingleTask(task);
          } catch (err) {}
        }
      }

      await syncSheetsToMongo();
    } catch (error) {
      console.error('Google Sheets worker execution failed:', error.message);
    }
  }, 120000);
};

/**
 * Delete a registration row from Google Sheets when cancelled/deleted in MongoDB
 */
const deleteRegistrationFromSheets = async (registrationId, eventId) => {
  if (!isConfigured || !sheetsClient) return;

  try {
    console.log(`[SHEETS] Attempting to clear event details for ID: ${registrationId}, Event: ${eventId}`);
    
    // In horizontal layout, we just delete the TRUE mark from the cell
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A:ZZ'
    });
    const rows = response.data.values || [];
    const headers = rows[0] || [];

    const Event = require('../models/Event');
    const event = await Event.findOne({ eventId });
    const eventName = event ? event.name : '';

    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === registrationId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex !== -1 && eventName) {
      const eventNameIndex = headers.indexOf(eventName);
      if (eventNameIndex !== -1) {
        const colLetter = colIndexToLetter(eventNameIndex);
        
        // Clear the TRUE cell
        await sheetsClient.spreadsheets.values.update({
          spreadsheetId,
          range: `Registrations!${colLetter}${rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          resource: { values: [['']] }
        });

        // Clear team code if exists
        const teamColIndex = headers.indexOf(`${eventName} Team Code`);
        if (teamColIndex !== -1) {
          const teamColLetter = colIndexToLetter(teamColIndex);
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range: `Registrations!${teamColLetter}${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [['']] }
          });
        }
        
        console.log(`[SHEETS] Cleared event details on row ${rowIndex} for ID: ${registrationId}, Event: ${eventName}`);
      }
    }
  } catch (err) {
    console.error('[SHEETS ERROR] Failed to clear registration cell:', err.message);
  }
};

module.exports = {
  queueParticipantSync,
  queueRegistrationSync,
  startQueueWorker,
  deleteRegistrationFromSheets,
};
