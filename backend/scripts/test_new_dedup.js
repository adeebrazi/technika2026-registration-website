const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function testMapping() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.models.User || require('../models/User');

  const websiteUsers = await User.find({ source: 'website' });
  const googleUsers = await User.find({ source: 'google_form' });
  console.log(`Current DB: ${websiteUsers.length} website users, ${googleUsers.length} google_form users`);

  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const ogRows = parseCsv(csv);

  console.log(`OG Google Sheet: ${ogRows.length} total rows`);

  const websiteDuplicates = [];
  const validGoogleFormRows = [];

  for (let i = 0; i < ogRows.length; i++) {
    const r = ogRows[i];
    const name = (r.NAME || r.Name || r['STUDENT NAME'] || '').trim();
    const email = (r['Email address'] || r.EMAIL || r.email || '').trim().toLowerCase();
    const phone = (r['CONTACT NUMBER'] || r['Contact Number'] || '').replace(/[^0-9]/g, '').slice(-10);
    const utr = (r['TRANSACTION/UTR NUMBER'] || r['Transaction/UTR Number'] || '').trim();
    const inst = (r['SCHOOL/COLLEGE/UNIVERSITY NAME\nIf your institute name is not found in the drop-down, please reach out to us on +91 62067 82574.'] || r.INSTITUTION || '').trim();

    // Check duplicate with WEBSITE ONLY
    let matchedWebsite = null;
    let matchReason = '';

    for (const w of websiteUsers) {
      const wEmail = (w.email || '').trim().toLowerCase();
      const wName = (w.name || '').trim().toLowerCase();
      const wPhone = (w.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);
      const wUtr = (w.paymentUTR || '').trim();

      if (email && wEmail && email === wEmail) {
        matchedWebsite = w;
        matchReason = 'EMAIL_MATCH';
        break;
      }
      if (phone && wPhone && phone === wPhone && name.toLowerCase() === wName) {
        matchedWebsite = w;
        matchReason = 'PHONE_AND_NAME_MATCH';
        break;
      }
      if (utr && utr.length >= 6 && wUtr && utr.toLowerCase() === wUtr.toLowerCase()) {
        matchedWebsite = w;
        matchReason = 'UTR_MATCH';
        break;
      }
      if (name && wName && name.toLowerCase() === wName && inst && w.institution && inst.toLowerCase() === w.institution.toLowerCase()) {
        matchedWebsite = w;
        matchReason = 'NAME_AND_INSTITUTION_MATCH';
        break;
      }
    }

    if (matchedWebsite) {
      websiteDuplicates.push({
        row: i + 2,
        name,
        email,
        matchedWebsite: matchedWebsite.registrationId + ' (' + matchedWebsite.name + ')',
        reason: matchReason
      });
    } else {
      validGoogleFormRows.push({
        row: i + 2,
        name,
        email,
        phone,
        inst,
        timestamp: r.Timestamp
      });
    }
  }

  console.log(`\nFound ${websiteDuplicates.length} rows duplicate with Website.`);
  console.log(`Found ${validGoogleFormRows.length} valid Google Form rows to allot.`);

  // Check which of the 111 rows already match an existing google_form user in DB
  let alreadyInDbCount = 0;
  let newToAllotCount = 0;
  const newToAllot = [];

  for (const item of validGoogleFormRows) {
    const existing = googleUsers.find(u => {
      const uName = (u.name || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const iName = item.name.toLowerCase();
      const iEmail = item.email.toLowerCase();
      return (uName === iName && (uEmail === iEmail || (u.whatsapp && u.whatsapp.includes(item.phone))));
    });

    if (existing) {
      alreadyInDbCount++;
    } else {
      newToAllotCount++;
      newToAllot.push(item);
    }
  }

  console.log(`Already in DB (Google Form): ${alreadyInDbCount}`);
  console.log(`New to allot (previously skipped by old deduplication): ${newToAllotCount}`);
  console.log('Sample new to allot:', newToAllot);

  await mongoose.disconnect();
}
testMapping().catch(console.error);
