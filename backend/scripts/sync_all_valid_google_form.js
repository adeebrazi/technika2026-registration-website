const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');
const { processGoogleFormSubmission } = require('../services/googleFormService');
const mongoose = require('mongoose');
const { google } = require('googleapis');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function syncAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.models.User || require('../models/User');
  const Registration = mongoose.models.Registration || require('../models/Registration');
  const Event = mongoose.models.Event || require('../models/Event');

  const websiteUsers = await User.find({ source: 'website' });
  console.log(`Website users in DB: ${websiteUsers.length}`);

  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const ogRows = parseCsv(csv);
  console.log(`Fetched ${ogRows.length} rows from OG sheet.`);

  // 1. Identify rows that duplicate website registrations
  const websiteDuplicateRowIndices = new Set();
  for (let i = 0; i < ogRows.length; i++) {
    const r = ogRows[i];
    const name = (r.NAME || r.Name || '').trim().toLowerCase();
    const email = (r['Email address'] || r.EMAIL || '').trim().toLowerCase();
    const phone = (r['CONTACT NUMBER'] || '').replace(/[^0-9]/g, '').slice(-10);
    const utr = (r['TRANSACTION/UTR NUMBER'] || '').trim().toLowerCase();
    const inst = (r['SCHOOL/COLLEGE/UNIVERSITY NAME\nIf your institute name is not found in the drop-down, please reach out to us on +91 62067 82574.'] || '').trim().toLowerCase();

    for (const w of websiteUsers) {
      const wEmail = (w.email || '').trim().toLowerCase();
      const wName = (w.name || '').trim().toLowerCase();
      const wPhone = (w.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);
      const wUtr = (w.paymentUTR || '').trim().toLowerCase();

      if ((email && wEmail && email === wEmail) ||
          (phone && wPhone && phone === wPhone && name === wName) ||
          (utr && utr.length >= 6 && wUtr && utr === wUtr) ||
          (name && wName && name === wName && inst && w.institution && inst === w.institution.toLowerCase())) {
        websiteDuplicateRowIndices.add(i);
        console.log(`Row ${i + 2}: Duplicate of website user ${w.registrationId} (${w.name}) -> SKIPPING.`);
        break;
      }
    }
  }

  console.log(`Total website duplicates excluded: ${websiteDuplicateRowIndices.size}`);

  const validRows = ogRows.map((r, idx) => ({ rowNum: idx + 2, data: r })).filter((_, idx) => !websiteDuplicateRowIndices.has(idx));
  console.log(`Total valid Google Form rows to process: ${validRows.length}`);

  // 2. Process each valid row
  let newlyAllotted = 0;
  let alreadyPresent = 0;

  for (const item of validRows) {
    const res = await processGoogleFormSubmission(item.data);
    if (res.alreadyAllotted) {
      alreadyPresent++;
    } else if (res.success && !res.duplicate) {
      newlyAllotted++;
      console.log(`Allotted Row ${item.rowNum} (${item.data.NAME}) with new ID: ${res.registrationId}`);
    } else {
      console.log(`Row ${item.rowNum} result:`, res);
    }
  }

  console.log(`\nSync Summary: Newly Allotted: ${newlyAllotted}, Already Present: ${alreadyPresent}`);

  // 3. Verify total Google Form users in DB now
  const totalGFormInDb = await User.countDocuments({ source: 'google_form' });
  const totalWebsiteInDb = await User.countDocuments({ source: 'website' });
  const grandTotal = await User.countDocuments();
  console.log(`Updated DB Counts: Google Form: ${totalGFormInDb}, Website: ${totalWebsiteInDb}, Grand Total: ${grandTotal}`);

  // 4. Re-populate Google_Form_Allotted tab
  console.log(`\nRebuilding Google_Form_Allotted sheet tab...`);
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  const auth = new google.auth.JWT(
    serviceEmail,
    null,
    privateKey.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const TAB_NAME = 'Google_Form_Allotted';

  const HEADERS = [
    'Registration ID',
    'Student Name',
    'Email',
    'WhatsApp',
    'Institution',
    'Course / Standard',
    'Gender',
    'Payment UTR',
    'Drive Screenshot URL',
    'Registered Events',
    'Event Count',
    'Allotted Date',
    'Source'
  ];

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheet = meta.data.sheets.find(s => s.properties.title === TAB_NAME);
  const sheetId = existingSheet.properties.sheetId;

  // Clear existing
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${TAB_NAME}!A:Z`
  });

  const allEvents = await Event.find({});
  const eventMap = {};
  allEvents.forEach(e => { eventMap[e.eventId] = e.name; });

  const allGUsers = await User.find({ source: 'google_form' }).sort({ createdAt: 1 });
  console.log(`Writing ${allGUsers.length} Google Form users to "${TAB_NAME}"...`);

  const rowsToWrite = [HEADERS];
  for (const u of allGUsers) {
    const userRegs = await Registration.find({ registrationId: u.registrationId });
    const eventNames = userRegs.map(r => eventMap[r.eventId] || r.eventId).join(', ');

    rowsToWrite.push([
      u.registrationId,
      u.name || '',
      u.email || '',
      u.whatsapp || '',
      u.institution || '',
      u.course ? `${u.course} ${u.semester || ''}`.trim() : (u.semester || ''),
      u.gender || '',
      u.paymentUTR || '',
      u.paymentScreenshotUrl || '',
      eventNames,
      userRegs.length,
      u.createdAt ? new Date(u.createdAt).toLocaleString() : '',
      'google_form'
    ]);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${TAB_NAME}!A1:M${rowsToWrite.length}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: rowsToWrite }
  });

  // Format header
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.1, green: 0.2, blue: 0.35 },
                textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        },
        {
          autoResizeDimensions: {
            dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: HEADERS.length }
          }
        }
      ]
    }
  });

  console.log(`SUCCESS! Google_Form_Allotted tab populated with ${allGUsers.length} registrations.`);

  await mongoose.disconnect();
}

syncAll().catch(console.error);
