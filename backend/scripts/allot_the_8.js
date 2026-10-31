const { fetchCsvWithRedirect, parseCsv } = require('../services/googleSheetPoller');
const { processGoogleFormSubmission } = require('../services/googleFormService');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function allotThe8() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.models.User || require('../models/User');

  const url = 'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';
  const csv = await fetchCsvWithRedirect(url);
  const ogRows = parseCsv(csv);

  // Exact target row indices (1-indexed row in sheet: 31, 39, 54, 70, 71, 84, 90, 94)
  const targetRowNums = [31, 39, 54, 70, 71, 84, 90, 94];

  for (const rowNum of targetRowNums) {
    const rowData = ogRows[rowNum - 2];
    console.log(`Processing OG Row ${rowNum} (${rowData.NAME})...`);
    const res = await processGoogleFormSubmission(rowData);
    console.log(`Result for Row ${rowNum}:`, res);
  }

  const gCount = await User.countDocuments({ source: 'google_form' });
  const wCount = await User.countDocuments({ source: 'website' });
  console.log(`DB Counts after allotment: Google Form: ${gCount}, Website: ${wCount}, Total: ${gCount + wCount}`);

  await mongoose.disconnect();
}
allotThe8().catch(console.error);
