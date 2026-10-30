const https = require('https');
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

async function detailedCheck() {
  await connectDB();

  const csv = await fetchCsv(CSV_URL);
  const rows = parseCsv(csv);
  const dataRows = rows.slice(1);

  console.log(`Total data rows in Google Form: ${dataRows.length}`);

  const allUsers = await User.find({}).lean();
  console.log(`Total users in MongoDB: ${allUsers.length}`);

  let inGoogleFormSource = 0;
  let inWebsiteSource = 0;
  let notInMongo = [];

  dataRows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const email = (r[1] || '').trim().toLowerCase();
    const name = (r[2] || '').trim().toLowerCase();
    const phone = (r[3] || '').trim();

    // Match by exact email or name
    const matches = allUsers.filter(u => 
      (email && u.email && u.email.toLowerCase() === email) ||
      (name && u.name && u.name.toLowerCase() === name)
    );

    if (matches.length > 0) {
      const gMatch = matches.find(m => m.source === 'google_form');
      if (gMatch) {
        inGoogleFormSource++;
      } else {
        inWebsiteSource++;
        console.log(`[ROW ${rowNum}] "${r[2]}" (${r[1]}) -> Found in Mongo as source: "${matches[0].source}" (ID: ${matches[0].registrationId})`);
      }
    } else {
      notInMongo.push({ rowNum, name: r[2], email: r[1], phone: r[3], raw: r });
    }
  });

  console.log(`\nMatched in google_form: ${inGoogleFormSource}`);
  console.log(`Matched in website/other: ${inWebsiteSource}`);
  console.log(`NOT in MongoDB at all: ${notInMongo.length}`);

  notInMongo.forEach(m => {
    console.log(`Row ${m.rowNum}: "${m.name}" | "${m.email}" | "${m.phone}"`);
  });

  process.exit(0);
}

detailedCheck().catch(console.error);
