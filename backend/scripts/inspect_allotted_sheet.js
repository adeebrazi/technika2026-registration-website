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
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Google_Form_Allotted!A:M'
  });
  const rows = res.data.values || [];
  
  const mayankRows = rows.filter(r => r[1] && r[1].toLowerCase().includes('mayank kumar sharma'));
  console.log('Mayank rows in Google_Form_Allotted:', JSON.stringify(mayankRows, null, 2));
  
  const vriddhiRows = rows.filter(r => r[1] && r[1].toLowerCase().includes('vriddhi'));
  console.log('Vriddhi rows in Google_Form_Allotted:', JSON.stringify(vriddhiRows, null, 2));

  console.log('Row 1 (index 1):', rows[1]);
  console.log('Row 80 (index 80):', rows[80]);
  console.log('Row 100 (index 100):', rows[100]);
  console.log('Row 150 (index 150):', rows[150]);
}
check().catch(console.error);
