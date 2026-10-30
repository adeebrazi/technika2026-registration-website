const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');

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

async function analyze() {
  await connectDB();

  console.log('Fetching Google Form CSV...');
  const csv = await fetchCsv(CSV_URL);
  const rows = parseCsv(csv);
  console.log(`Total rows parsed from CSV (including header): ${rows.length}`);
  const header = rows[0];
  const dataRows = rows.slice(1);
  console.log(`Total data rows in Google Form Sheet: ${dataRows.length}`);

  // Fetch all google_form users in DB
  const formUsers = await User.find({ source: 'google_form' }).lean();
  console.log(`Current google_form users in Mongo: ${formUsers.length}`);

  // For each data row, check if it exists in Mongo
  const registeredNames = new Set(formUsers.map(u => u.name.toLowerCase().trim()));
  const missingRows = [];

  dataRows.forEach((r, idx) => {
    // Usually col 1 or 2 is name, let's find name
    const timestamp = r[0];
    const email = r[1];
    const name = r[2];
    const phone = r[3];
    const inst = r[4];

    const isFound = formUsers.some(u => 
      u.name.toLowerCase().trim() === (name || '').toLowerCase().trim() ||
      (phone && u.whatsapp && u.whatsapp.includes(phone.slice(-10)))
    );

    if (!isFound) {
      missingRows.push({
        rowNum: idx + 2,
        timestamp,
        email,
        name,
        phone,
        institution: inst,
        allCols: r
      });
    }
  });

  console.log(`Missing / Skipped rows count: ${missingRows.length}`);
  missingRows.forEach(m => {
    console.log(`Row ${m.rowNum}: Name="${m.name}" | Email="${m.email}" | Phone="${m.phone}"`);
  });

  process.exit(0);
}

analyze().catch(err => {
  console.error(err);
  process.exit(1);
});
