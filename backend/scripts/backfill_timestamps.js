const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function backfillTimestamps() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.models.User || require('../models/User');

  const websiteUsers = await User.find({ source: 'website' });
  const googleUsers = await User.find({ source: 'google_form' });
  console.log(`DB has ${websiteUsers.length} website users, ${googleUsers.length} google_form users.`);

  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const ogRows = parseCsv(csv);

  // Exclude website duplicates
  const websiteDuplicates = new Set([4, 34, 47, 80, 81, 85, 93].map(r => r - 2));
  const validOgRows = ogRows.map((r, idx) => ({ rowNum: idx + 2, r })).filter((_, idx) => !websiteDuplicates.has(idx));

  console.log(`Valid OG rows: ${validOgRows.length}`);

  let backfilled = 0;
  const matchedUsers = new Set();
  const matchedRows = new Set();

  for (let i = 0; i < validOgRows.length; i++) {
    const { rowNum, r } = validOgRows[i];
    const rName = (r.NAME || r.Name || '').trim().toLowerCase();
    const rEmail = (r['Email address'] || r.EMAIL || '').trim().toLowerCase();
    const rPhone = (r['CONTACT NUMBER'] || '').replace(/[^0-9]/g, '').slice(-10);
    const rShot = (r['UPLOAD PAYMENT SCREENSHOT'] || '').trim();
    const ts = (r.Timestamp || '').trim();

    // Find the matching unassigned google_form user in DB
    for (const u of googleUsers) {
      if (matchedUsers.has(u.registrationId)) continue;
      const uName = (u.name || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhone = (u.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);
      const uShot = (u.paymentScreenshotUrl || '').trim();

      const nameMatch = uName === rName;
      const contactMatch = (rEmail && uEmail && uEmail === rEmail) || (rPhone && uPhone && uPhone === rPhone);
      const shotMatch = rShot && uShot && rShot === uShot;

      if ((nameMatch && contactMatch) || shotMatch) {
        matchedUsers.add(u.registrationId);
        matchedRows.add(i);
        await User.updateOne({ registrationId: u.registrationId }, { formTimestamp: ts });
        backfilled++;
        break;
      }
    }
  }

  console.log(`Successfully backfilled formTimestamp on ${backfilled} existing google_form users in DB.`);
  console.log(`Remaining valid OG rows that need to be allotted: ${validOgRows.length - matchedRows.size}`);
  
  const toAllot = validOgRows.filter((_, idx) => !matchedRows.has(idx));
  for (const item of toAllot) {
    console.log(`Needs Allotment: Row ${item.rowNum}: ${item.r.NAME} | ${item.r['Email address']} | ${item.r.Timestamp}`);
  }

  await mongoose.disconnect();
}
backfillTimestamps().catch(console.error);
