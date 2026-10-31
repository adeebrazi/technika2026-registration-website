const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function checkUnallotted() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.models.User || require('../models/User');

  const websiteUsers = await User.find({ source: 'website' });
  const googleUsers = await User.find({ source: 'google_form' });

  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const ogRows = parseCsv(csv);

  // Exclude the 7 website duplicates
  const websiteDuplicates = new Set([4, 34, 47, 80, 81, 85, 93].map(r => r - 2));

  const validOgRows = ogRows.filter((_, idx) => !websiteDuplicates.has(idx));
  console.log(`Total valid OG rows: ${validOgRows.length}`);

  // How many google_form users in DB?
  console.log(`Current google_form users in DB: ${googleUsers.length}`);

  // Match each googleUser to a valid OG row
  const matchedRowIndices = new Set();
  const matchedUsers = new Set();

  for (const u of googleUsers) {
    const uName = (u.name || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const uPhone = (u.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);

    for (let i = 0; i < validOgRows.length; i++) {
      if (matchedRowIndices.has(i)) continue;
      const r = validOgRows[i];
      const rName = (r.NAME || r.Name || '').trim().toLowerCase();
      const rEmail = (r['Email address'] || r.EMAIL || '').trim().toLowerCase();
      const rPhone = (r['CONTACT NUMBER'] || '').replace(/[^0-9]/g, '').slice(-10);

      if (uName === rName && (uEmail === rEmail || uPhone === rPhone)) {
        matchedRowIndices.add(i);
        matchedUsers.add(u.registrationId);
        break;
      }
    }
  }

  console.log(`Matched OG rows to DB users: ${matchedRowIndices.size}`);
  console.log(`Unmatched valid OG rows (NEED ALLOTMENT): ${validOgRows.length - matchedRowIndices.size}`);

  const unallotted = validOgRows.filter((_, idx) => !matchedRowIndices.has(idx));
  for (const item of unallotted) {
    console.log(`OG Row: Name: "${item.NAME}" | Email: "${item['Email address']}" | Date: "${item.Timestamp}" | Tech: "${item['TECHNICAL EVENTS']}" | Cult: "${item['CULTURAL EVENTS']}" | Crea: "${item['CREATIVE EVENTS']}"`);
  }

  await mongoose.disconnect();
}
checkUnallotted().catch(console.error);
