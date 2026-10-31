const { google } = require('googleapis');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function check() {
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
  
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetsList = meta.data.sheets || [];
  for (const s of sheetsList) {
    const p = s.properties;
    console.log(`Sheet: "${p.title}" (id: ${p.sheetId}, rows: ${p.gridProperties?.rowCount}, cols: ${p.gridProperties?.columnCount})`);
  }
}
check().catch(console.error);
