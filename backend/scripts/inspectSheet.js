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
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('Sheet Tabs:');
    meta.data.sheets.forEach(s => {
      console.log(` - ID: ${s.properties.sheetId}, Title: "${s.properties.title}", Rows: ${s.properties.gridProperties?.rowCount}, Cols: ${s.properties.gridProperties?.columnCount}`);
    });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Registrations!A1:Z5'
    });
    console.log('\nRow 1 (Headers):', res.data.values ? res.data.values[0] : 'EMPTY');
    if (res.data.values && res.data.values.length > 1) {
      console.log('\nRow 2:', res.data.values[1]);
    }
  } catch (e) {
    console.error('Error fetching sheet:', e.message);
  }
})();

