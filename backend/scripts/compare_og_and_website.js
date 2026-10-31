const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function compare() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.models.User || require('../models/User');
  
  // 1. Fetch website users from DB
  const websiteUsers = await User.find({ source: 'website' });
  console.log(`Total website users in DB: ${websiteUsers.length}`);

  // 2. Fetch OG sheet rows
  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const ogRows = parseCsv(csv);
  console.log(`Total data rows in OG Google Sheet: ${ogRows.length}`);

  // 3. For each OG row, check if it matches a WEBSITE registration!
  const matchesWebsite = [];
  const uniqueFromWebsite = [];

  for (let i = 0; i < ogRows.length; i++) {
    const r = ogRows[i];
    const name = (r.NAME || r.Name || r['STUDENT NAME'] || '').trim();
    const email = (r['Email address'] || r.EMAIL || r.email || '').trim().toLowerCase();
    const phone = (r['CONTACT NUMBER'] || r['Contact Number'] || '').replace(/[^0-9]/g, '').slice(-10);
    const utr = (r['TRANSACTION/UTR NUMBER'] || r['Transaction/UTR Number'] || '').trim();
    const inst = (r['SCHOOL/COLLEGE/UNIVERSITY NAME\nIf your institute name is not found in the drop-down, please reach out to us on +91 62067 82574.'] || r.INSTITUTION || '').trim();
    const ts = r.Timestamp || '';

    // Compare with website users
    let match = null;
    let matchReason = '';

    for (const w of websiteUsers) {
      const wEmail = (w.email || '').trim().toLowerCase();
      const wName = (w.name || '').trim().toLowerCase();
      const wPhone = (w.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);
      const wUtr = (w.paymentUTR || '').trim();

      if (email && wEmail && email === wEmail) {
        match = w;
        matchReason = 'EMAIL_MATCH';
        break;
      }
      if (phone && wPhone && phone === wPhone && name.toLowerCase() === wName) {
        match = w;
        matchReason = 'PHONE_AND_NAME_MATCH';
        break;
      }
      if (utr && utr.length >= 6 && wUtr && utr.toLowerCase() === wUtr.toLowerCase()) {
        match = w;
        matchReason = 'UTR_MATCH';
        break;
      }
      if (name && wName && name.toLowerCase() === wName && inst && w.institution && inst.toLowerCase() === w.institution.toLowerCase()) {
        match = w;
        matchReason = 'NAME_AND_INSTITUTION_MATCH';
        break;
      }
    }

    if (match) {
      matchesWebsite.push({
        rowNum: i + 2,
        name,
        email,
        phone,
        inst,
        timestamp: ts,
        matchedWebsiteUser: {
          id: match.registrationId,
          name: match.name,
          email: match.email,
          inst: match.institution
        },
        reason: matchReason
      });
    } else {
      uniqueFromWebsite.push({
        rowNum: i + 2,
        name,
        email,
        phone,
        inst,
        timestamp: ts
      });
    }
  }

  console.log(`\nResults:`);
  console.log(`OG rows matching Website registrations (DUPLICATES WITH WEBSITE): ${matchesWebsite.length}`);
  if (matchesWebsite.length > 0) {
    console.log('Duplicates with website:', JSON.stringify(matchesWebsite, null, 2));
  }
  console.log(`OG rows UNIQUE from Website: ${uniqueFromWebsite.length}`);

  // Let's also check: within OG rows themselves, are there multiple rows with same student name?
  const nameCounts = {};
  for (const u of uniqueFromWebsite) {
    const k = u.name.toLowerCase();
    nameCounts[k] = (nameCounts[k] || 0) + 1;
  }
  const multiInOg = Object.entries(nameCounts).filter(([k, v]) => v > 1);
  console.log(`Within OG unique-from-website rows, names appearing > 1 time: ${multiInOg.length}`);
  if (multiInOg.length > 0) {
    console.log('Sample names appearing multiple times in OG sheet:', multiInOg);
  }

  await mongoose.disconnect();
}
compare().catch(console.error);
