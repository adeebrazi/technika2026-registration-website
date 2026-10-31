const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function findThe7() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.models.User || require('../models/User');

  const websiteUsers = await User.find({ source: 'website' });
  const googleUsers = await User.find({ source: 'google_form' });

  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const ogRows = parseCsv(csv);

  // Map existing googleUsers by their initial matching OG rows
  // Let's identify the 7 website duplicates first
  const websiteDuplicates = new Set();
  for (let i = 0; i < ogRows.length; i++) {
    const r = ogRows[i];
    const name = (r.NAME || r.Name || '').trim().toLowerCase();
    const email = (r['Email address'] || r.EMAIL || '').trim().toLowerCase();
    const phone = (r['CONTACT NUMBER'] || '').replace(/[^0-9]/g, '').slice(-10);
    const utr = (r['TRANSACTION/UTR NUMBER'] || '').trim().toLowerCase();
    const inst = (r['SCHOOL/COLLEGE/UNIVERSITY NAME\nIf your institute name is not found in the drop-down, please reach out to us on +91 62067 82574.'] || '').trim().toLowerCase();

    for (const w of websiteUsers) {
      const wEmail = (w.email || '').trim().toLowerCase();
      const wName = (w.name || '').trim().toLowerCase();
      const wPhone = (w.whatsapp || '').replace(/[^0-9]/g, '').slice(-10);
      const wUtr = (w.paymentUTR || '').trim().toLowerCase();

      if ((email && wEmail && email === wEmail) ||
          (phone && wPhone && phone === wPhone && name === wName) ||
          (utr && utr.length >= 6 && wUtr && utr === wUtr) ||
          (name && wName && name === wName && inst && w.institution && inst === w.institution.toLowerCase())) {
        websiteDuplicates.add(i);
        break;
      }
    }
  }

  console.log(`Website duplicates rows in OG sheet (total ${websiteDuplicates.size}):`, Array.from(websiteDuplicates).map(idx => idx + 2));

  // The remaining 111 rows are valid Google Form submissions
  const validOgRows = ogRows.map((r, idx) => ({ rowNum: idx + 2, data: r })).filter((_, idx) => !websiteDuplicates.has(idx));
  console.log(`Valid OG rows to be in Google_Form_Allotted: ${validOgRows.length}`);

  for (const item of validOgRows) {
    console.log(`Row ${item.rowNum}: ${item.data.NAME} | ${item.data['Email address']} | ${item.data.Timestamp}`);
  }

  await mongoose.disconnect();
}
findThe7().catch(console.error);
