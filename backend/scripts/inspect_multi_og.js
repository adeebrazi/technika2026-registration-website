const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');

async function check() {
  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const rows = parseCsv(csv);
  
  const targetNames = ['aman sinha', 'shaktidev prasad', 'anita mahato', 'ritesh kumar'];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = (r.NAME || r.Name || r['STUDENT NAME'] || '').trim().toLowerCase();
    if (targetNames.some(t => name.includes(t))) {
      console.log(`Row ${i+2}: Name: ${r.NAME} | Email: ${r['Email address']} | Phone: ${r['CONTACT NUMBER']} | Tech: ${r['TECHNICAL EVENTS']} | Cult: ${r['CULTURAL EVENTS']} | Crea: ${r['CREATIVE EVENTS']} | UTR: ${r['TRANSACTION/UTR NUMBER']}`);
    }
  }
}
check().catch(console.error);
