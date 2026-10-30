const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkSheet() {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let cleanKey = process.env.GOOGLE_PRIVATE_KEY;
  if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
    cleanKey = cleanKey.substring(1, cleanKey.length - 1);
  }
  const auth = new google.auth.JWT(
    serviceEmail,
    null,
    cleanKey.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Registrations!A1:E70'
  });

  const rows = res.data.values || [];
  console.log('Total rows retrieved:', rows.length);
  rows.slice(-8).forEach((r, idx) => {
    const rowNum = rows.length - 8 + idx + 1;
    console.log(`Row ${rowNum}: [${r[0]}] ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]}`);
  });
}

checkSheet().catch(console.error);
