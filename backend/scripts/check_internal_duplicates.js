const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CSV_URL = process.env.GOOGLE_SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';

function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchCsv(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function checkInternalDuplicates() {
  const csv = await fetchCsv(CSV_URL);
  const rows = parseCsv(csv);
  const dataRows = rows.slice(1);

  console.log(`Total data rows: ${dataRows.length}`);

  const nameMap = {};
  const emailMap = {};

  dataRows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const timestamp = r[0];
    const email = (r[1] || '').trim().toLowerCase();
    const name = (r[2] || '').trim().toLowerCase();
    const phone = (r[3] || '').trim();

    if (!nameMap[name]) nameMap[name] = [];
    nameMap[name].push({ rowNum, timestamp, name: r[2], email: r[1], phone });

    if (!emailMap[email]) emailMap[email] = [];
    emailMap[email].push({ rowNum, timestamp, name: r[2], email: r[1], phone });
  });

  console.log('--- Duplicate Names in Google Form Sheet ---');
  Object.entries(nameMap).forEach(([name, list]) => {
    if (list.length > 1) {
      console.log(`Name "${name}" appears ${list.length} times:`, list);
    }
  });

  console.log('\n--- Duplicate Emails in Google Form Sheet ---');
  Object.entries(emailMap).forEach(([email, list]) => {
    if (list.length > 1) {
      console.log(`Email "${email}" appears ${list.length} times:`, list);
    }
  });
}

checkInternalDuplicates().catch(console.error);
