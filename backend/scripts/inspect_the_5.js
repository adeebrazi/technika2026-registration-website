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

async function inspectThe5() {
  await connectDB();
  const csv = await fetchCsv(CSV_URL);
  const rows = parseCsv(csv);
  const dataRows = rows.slice(1);

  const googleFormUsers = await User.find({ source: 'google_form' }).lean();
  const websiteUsers = await User.find({ source: { $ne: 'google_form' } }).lean();

  console.log(`Total data rows in Google Form: ${dataRows.length}`);
  console.log(`google_form users in Mongo: ${googleFormUsers.length}`);

  const notGoogleForm = [];

  dataRows.forEach((r, idx) => {
    const rowNum = idx + 2;
    const email = (r[1] || '').trim().toLowerCase();
    const name = (r[2] || '').trim().toLowerCase();
    const phone = (r[3] || '').trim();

    const gUser = googleFormUsers.find(u => 
      (email && u.email && u.email.toLowerCase() === email && u.name && u.name.toLowerCase() === name) ||
      (email && u.email && u.email.toLowerCase() === email) ||
      (name && u.name && u.name.toLowerCase() === name)
    );

    if (!gUser) {
      // Check if they are in website
      const wUser = websiteUsers.find(u =>
        (email && u.email && u.email.toLowerCase() === email) ||
        (name && u.name && u.name.toLowerCase() === name)
      );

      notGoogleForm.push({
        rowNum,
        name: r[2],
        email: r[1],
        phone: r[3],
        institution: r[4],
        utr: r[6],
        foundInWebsite: wUser ? `${wUser.registrationId} (${wUser.name})` : 'NO'
      });
    }
  });

  console.log(`Found ${notGoogleForm.length} rows not in google_form users:`);
  console.log(JSON.stringify(notGoogleForm, null, 2));

  process.exit(0);
}

inspectThe5().catch(console.error);
