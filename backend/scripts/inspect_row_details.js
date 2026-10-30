const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRow67and68() {
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
    range: 'Registrations!A65:K69'
  });

  console.log('Rows 65-69 in Registrations tab:');
  (res.data.values || []).forEach((r, idx) => {
    console.log(`Row ${65 + idx}:`, r);
  });
}

checkRow67and68().catch(console.error);
