const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../models/User');

    const csvUrl = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
    const csvData = await fetchCsvWithRedirect(csvUrl);
    const rows = parseCsv(csvData);

    console.log(`Fetched ${rows.length} rows from Google Sheet.`);

    const schoolStudents = await User.find({ institution: 'School Student' });
    console.log(`Found ${schoolStudents.length} users in DB with institution = 'School Student'. Reconciling...`);

    let updatedCount = 0;

    for (const u of schoolStudents) {
      const uNorm = u.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const emailNorm = u.email.toLowerCase().trim();

      const match = rows.find(r => {
        const rName = (r.NAME || r.Name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const rEmail = (r['Email address'] || r.Email || '').toLowerCase().trim();
        return (rName === uNorm && rEmail === emailNorm) || (rName === uNorm) || (rEmail === emailNorm && emailNorm !== 'hirak1.biswas1@gmail.com');
      });

      if (match) {
        let inst = '';
        for (const [k, v] of Object.entries(match)) {
          const kClean = k.toLowerCase().replace(/\s+/g, ' ');
          if ((kClean.includes('school') || kClean.includes('college') || kClean.includes('institute') || kClean.includes('university')) && !kClean.includes('current education status')) {
            if (v && v.trim()) inst = v.trim();
          }
        }

        let status = match['CURRENT EDUCATION STATUS'] || match['Current Education Status'] || '';
        let sem = match['SEMESTER / STANDARD'] || match['Semester / Standard'] || '';
        let rawGen = match['GENDER'] || match['Gender'] || '';

        let gen = u.gender;
        if (rawGen) {
          const g = rawGen.toLowerCase().trim();
          if (g.startsWith('m')) gen = 'Male';
          else if (g.startsWith('f')) gen = 'Female';
        }

        if (inst && inst !== 'School Student') {
          u.institution = inst;
          if (status) u.course = status;
          if (sem) u.semester = sem;
          if (gen) u.gender = gen;
          await u.save();
          updatedCount++;
          console.log(`✓ UPDATED: ${u.registrationId} | ${u.name} -> Institution: "${inst}", Course: "${status}", Sem: "${sem}", Gender: "${gen}"`);
        }
      }
    }

    console.log(`\nReconciliation completed! Successfully updated ${updatedCount}/${schoolStudents.length} users.`);
    process.exit(0);
  } catch (e) {
    console.error('Reconciliation error:', e);
    process.exit(1);
  }
})();
