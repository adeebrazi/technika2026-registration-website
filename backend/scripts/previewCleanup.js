const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
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

(async () => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A99:L103'
    });

    console.log('Rows 99 to 103:');
    (res.data.values || []).forEach((r, idx) => {
      console.log(`Row ${99 + idx}: [${r[0]}] ${r[1]} -> Col K: ${r[10]}`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
