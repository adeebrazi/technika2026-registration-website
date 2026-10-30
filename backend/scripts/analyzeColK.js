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
      range: 'Registrations!A1:L150'
    });

    const rows = res.data.values || [];
    console.log(`Total rows fetched: ${rows.length}`);
    const headers = rows[0];
    console.log('Header A-L:');
    headers.forEach((h, i) => console.log(`  Col ${String.fromCharCode(65 + i)} (Index ${i}): ${h}`));

    const cloudinaryRows = [];
    const driveRows = [];
    const offlineReceiptRows = [];
    const otherRows = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const regId = row[0] || 'NO_ID';
      const name = row[1] || 'NO_NAME';
      const colK = row[10] || ''; // Index 10 is Col K (Screenshot URL)
      const colL = row[11] || ''; // Index 11 is Col L (Registered At)

      const rowInfo = { rowNumber: i + 1, regId, name, colK, colL };

      if (colK.includes('cloudinary.com')) {
        cloudinaryRows.push(rowInfo);
      } else if (colK.includes('drive.google.com') || colK.includes('docs.google.com')) {
        driveRows.push(rowInfo);
      } else if (colK.includes('offline-receipt.png')) {
        offlineReceiptRows.push(rowInfo);
      } else {
        otherRows.push(rowInfo);
      }
    }

    console.log('\n--- BREAKDOWN BY COLUMN K ---');
    console.log(`Cloudinary rows (KEEP): ${cloudinaryRows.length}`);
    console.log(`Google Drive rows (REMOVE): ${driveRows.length}`);
    console.log(`Offline-receipt.png rows (REMOVE): ${offlineReceiptRows.length}`);
    console.log(`Other/Empty Col K rows: ${otherRows.length}`);

    if (otherRows.length > 0) {
      console.log('\nDetails of Other/Empty Col K rows:');
      otherRows.forEach(r => console.log(`  Row ${r.rowNumber}: [${r.regId}] ${r.name} -> Col K: "${r.colK}"`));
    }

    if (driveRows.length > 0) {
      console.log(`\nSample Google Drive rows (first 3):`);
      driveRows.slice(0, 3).forEach(r => console.log(`  Row ${r.rowNumber}: [${r.regId}] ${r.name} -> "${r.colK}"`));
    }

    if (offlineReceiptRows.length > 0) {
      console.log(`\nSample Offline-Receipt rows (first 3):`);
      offlineReceiptRows.slice(0, 3).forEach(r => console.log(`  Row ${r.rowNumber}: [${r.regId}] ${r.name} -> "${r.colK}"`));
    }

  } catch (e) {
    console.error('Error analyzing rows:', e.message);
  }
})();

