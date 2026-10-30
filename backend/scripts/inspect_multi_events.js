const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

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

async function inspectRowWithMultiEvents() {
  await connectDB();
  const csv = await fetchCsv(CSV_URL);
  const rows = parseCsv(csv);
  
  // Find row containing 'FIRE FREE COOKING' and 'CRICKET, FREE FIRE'
  const matchingRows = rows.filter(r => r.some(c => c.includes('FIRE FREE COOKING')));
  console.log(`Found ${matchingRows.length} rows with FIRE FREE COOKING:`);

  for (const r of matchingRows) {
    const name = r[2];
    const email = r[1];
    console.log(`\nRow: Name="${name}", Email="${email}"`);
    console.log(`  Cols: Tech="${r[4]}", Cult="${r[5]}", Creat="${r[6]}"`);

    const u = await User.findOne({ 
      $or: [
        { email: email.toLowerCase().trim() },
        { name: name.trim() }
      ]
    }).lean();

    if (u) {
      const regs = await Registration.find({ registrationId: u.registrationId }).lean();
      console.log(`  -> MongoDB User: [${u.registrationId}] (source: ${u.source})`);
      console.log(`  -> Total registered events in MongoDB: ${regs.length}`);
      for (const reg of regs) {
        const ev = await Event.findOne({ eventId: reg.eventId }).lean();
        console.log(`     * ${ev?.name} (${reg.eventId}) [${ev?.category}]`);
      }
    } else {
      console.log(`  -> NOT found in MongoDB!`);
    }
  }
  process.exit(0);
}

inspectRowWithMultiEvents().catch(console.error);
