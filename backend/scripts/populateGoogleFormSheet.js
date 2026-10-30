const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { google } = require('googleapis');

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
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

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../models/User');
    const Registration = require('../models/Registration');
    const Event = require('../models/Event');

    // 1. Ensure sheet tab exists
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheet = meta.data.sheets.find(s => s.properties.title === TAB_NAME);
    let sheetId;

    if (!existingSheet) {
      console.log(`Creating tab "${TAB_NAME}"...`);
      const addRes = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: TAB_NAME,
                  gridProperties: {
                    frozenRowCount: 1,
                  }
                }
              }
            }
          ]
        }
      });
      sheetId = addRes.data.replies[0].addSheet.properties.sheetId;
      console.log(`Created tab with sheetId: ${sheetId}`);
    } else {
      sheetId = existingSheet.properties.sheetId;
      console.log(`Tab "${TAB_NAME}" already exists (sheetId: ${sheetId}). Clearing existing data...`);
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${TAB_NAME}!A:Z`
      });
    }

    // 2. Fetch all events map
    const events = await Event.find({});
    const eventMap = {};
    events.forEach(e => {
      eventMap[e.eventId] = e.name;
    });

    // 3. Fetch all Google Form users
    const googleUsers = await User.find({ source: 'google_form' }).sort({ createdAt: 1 });
    console.log(`Found ${googleUsers.length} Google Form users to write.`);

    const rowsToWrite = [HEADERS];

    for (const u of googleUsers) {
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

    // 4. Write data to sheet
    console.log(`Writing ${rowsToWrite.length} rows (including header) to "${TAB_NAME}"...`);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${TAB_NAME}!A1:M${rowsToWrite.length}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rowsToWrite
      }
    });

    // 5. Format Header row with bold text and background
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
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
              dimensions: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: HEADERS.length
              }
            }
          }
        ]
      }
    });

    console.log(`SUCCESS! Tab "${TAB_NAME}" is now populated and formatted with ${googleUsers.length} allotted registrations.`);
    process.exit(0);
  } catch (e) {
    console.error('Error populating sheet:', e.message);
    process.exit(1);
  }
})();

