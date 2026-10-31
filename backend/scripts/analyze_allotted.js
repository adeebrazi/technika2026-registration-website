const { google } = require('googleapis');
const mongoose = require('mongoose');
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
  
  const dates = {};
  for (let i = 1; i < rows.length; i++) {
    const d = rows[i][11] ? rows[i][11].split(',')[0] : 'Unknown';
    dates[d] = (dates[d] || 0) + 1;
  }
  console.log('Row counts by date:', dates);
  
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  let existInDb = 0;
  let notInDb = 0;
  const notInDbRows = [];
  const existInDbRows = [];
  
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    const u = await User.findOne({ registrationId: id });
    if (u) {
      existInDb++;
      existInDbRows.push({ rowIdx: i + 1, id, name: rows[i][1], date: rows[i][11], inst: rows[i][4] });
    } else {
      notInDb++;
      notInDbRows.push({ rowIdx: i + 1, id, name: rows[i][1], date: rows[i][11], inst: rows[i][4] });
    }
  }
  console.log({ totalSheetRows: rows.length - 1, existInDb, notInDb });
  console.log('Sample notInDb (first 5):', notInDbRows.slice(0, 5));
  console.log('Sample notInDb (last 5):', notInDbRows.slice(-5));
  console.log('Sample existInDb (first 5):', existInDbRows.slice(0, 5));
  console.log('Sample existInDb (last 5):', existInDbRows.slice(-5));
  
  // Check why notInDb rows were created!
  // Where are row indices for notInDb?
  const notInDbIndices = notInDbRows.map(r => r.rowIdx);
  console.log(`notInDb row range: from row ${Math.min(...notInDbIndices)} to row ${Math.max(...notInDbIndices)}`);
  
  await mongoose.disconnect();
}
check().catch(console.error);
