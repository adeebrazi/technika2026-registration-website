const mongoose = require('mongoose');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function findMissing() {
  await connectDB();
  const User = require('../models/User');

  // Website users in Mongo
  const websiteUsers = await User.find({ source: { $ne: 'google_form' } }).sort({ createdAt: 1 }).lean();
  console.log(`Found ${websiteUsers.length} website users in MongoDB.`);

  // Auth with Google Sheets
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let cleanKey = process.env.GOOGLE_PRIVATE_KEY;
  if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
    cleanKey = cleanKey.substring(1, cleanKey.length - 1);
  }
  const auth = new google.auth.JWT(
    serviceEmail,
    null,
    cleanKey.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  // 1. Fetch Registrations tab
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Registrations!A:Z'
  });

  const rows = res.data.values || [];
  console.log(`Total rows in 'Registrations' tab (including header): ${rows.length}`);
  
  const header = rows[0] || [];
  console.log('Header columns:', header);

  // Column A is Registration ID in the sheet
  const sheetRows = rows.slice(1);
  const sheetRegIds = new Set(sheetRows.map(r => (r[0] || '').trim()).filter(Boolean));
  console.log(`Sheet has ${sheetRegIds.size} non-empty Registration IDs.`);

  // Find which Mongo website users are NOT in the sheet
  const missingFromSheet = websiteUsers.filter(u => !sheetRegIds.has(u.registrationId));
  console.log(`Missing from sheet count: ${missingFromSheet.length}`);
  missingFromSheet.forEach(u => {
    console.log('--- MISSING USER FROM SHEET ---');
    console.log({
      registrationId: u.registrationId,
      name: u.name,
      email: u.email,
      whatsapp: u.whatsapp,
      institution: u.institution,
      course: u.course,
      semester: u.semester,
      source: u.source,
      createdAt: u.createdAt,
      paymentUTR: u.paymentUTR,
      paymentScreenshotUrl: u.paymentScreenshotUrl,
      noDuesSlipUrl: u.noDuesSlipUrl,
      collegeIdCardUrl: u.collegeIdCardUrl
    });
  });

  // Also check if any sheet registration IDs are NOT in Mongo website users
  const mongoRegIds = new Set(websiteUsers.map(u => u.registrationId));
  const sheetOnly = Array.from(sheetRegIds).filter(id => !mongoRegIds.has(id));
  console.log(`In sheet but NOT in Mongo website users:`, sheetOnly);

  // Check email duplicates in MongoDB website users
  const emailCounts = {};
  websiteUsers.forEach(u => {
    const em = (u.email || '').toLowerCase().trim();
    if (!emailCounts[em]) emailCounts[em] = [];
    emailCounts[em].push(u.registrationId);
  });
  const dupeEmails = Object.entries(emailCounts).filter(([k, v]) => v.length > 1);
  console.log('Duplicate emails in Mongo website users:', dupeEmails);

  await mongoose.disconnect();
  process.exit(0);
}

findMissing().catch(err => {
  console.error(err);
  process.exit(1);
});
