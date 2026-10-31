const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');

async function test() {
  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const rows = parseCsv(csv);
  console.log('Total rows in OG Google Sheet:', rows.length);
  if (rows.length > 0) {
    console.log('Keys:', Object.keys(rows[0]));
    console.log('Last 15 rows:');
    for (let i = Math.max(0, rows.length - 15); i < rows.length; i++) {
      const r = rows[i];
      const name = r.NAME || r.Name || r['STUDENT NAME'] || r.name;
      const email = r['EMAIL ADDRESS'] || r.EMAIL || r.Email || r.email;
      const ts = r.Timestamp || r.timestamp;
      const inst = r['SCHOOL/COLLEGE/UNIVERSITY NAME\nIf your institute name is not found in the drop-down, please reach out to us on +91 62067 82574.'] || r.INSTITUTION || r.institution;
      console.log(`Sheet Row ${i+2}: ${name} | ${email} | ${inst} | ${ts}`);
    }
  }
}
test().catch(console.error);
