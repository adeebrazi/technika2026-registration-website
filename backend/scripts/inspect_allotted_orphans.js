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
  
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  console.log('--- ROW BY ROW CHECK ---');
  let matchOtherIdCount = 0;
  let completelyMissingCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    const name = rows[i][1];
    const email = rows[i][2];
    const inst = rows[i][4];
    const date = rows[i][11];
    const inDb = await User.findOne({ registrationId: id });
    if (!inDb) {
      const userByName = await User.findOne({ name: new RegExp('^' + name.trim() + '$', 'i') });
      if (userByName) {
        matchOtherIdCount++;
        console.log(`Row ${i+1}: Phantom ID ${id} | Name: ${name} | Sheet Inst: ${inst} -> ALREADY IN DB with Real ID: ${userByName.registrationId} (${userByName.institution})`);
      } else {
        completelyMissingCount++;
        console.log(`Row ${i+1}: Phantom ID ${id} | Name: ${name} | Sheet Inst: ${inst} -> COMPLETELY MISSING IN DB!`);
      }
    }
  }
  console.log({ totalNotMatchingIdInDb: matchOtherIdCount + completelyMissingCount, matchOtherIdCount, completelyMissingCount });
  await mongoose.disconnect();
}
check().catch(console.error);
