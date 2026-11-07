const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const SyncLock = require('../models/SyncLock');
const { syncGoogleSheetNow } = require('../services/googleSheetPoller');

async function main() {
  await connectDB();
  console.log('Connected to MongoDB. Clearing any stale sync locks...');
  await SyncLock.deleteMany({});

  console.log('Triggering syncGoogleSheetNow()...');
  const startTime = Date.now();
  const res = await syncGoogleSheetNow();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n=== SYNC RESULT in ${elapsed}s ===`);
  console.log(JSON.stringify(res, null, 2));

  // Query MongoDB to verify Ramakrishna count and Sri Krishna count
  const User = require('../models/User');
  const ramakrishnaUsers = await User.find({ institution: /RAMAKRISHNA/i }).select('registrationId name institution').lean();
  console.log(`\nTotal Ramakrishna users in MongoDB: ${ramakrishnaUsers.length}`);
  ramakrishnaUsers.slice(0, 5).forEach(u => console.log(`  [${u.registrationId}] ${u.name}: ${u.institution}`));

  const sriKrishnaUsers = await User.find({ institution: 'SRI KRISHNA PUBLIC SCHOOL' }).countDocuments();
  console.log(`Total SRI KRISHNA PUBLIC SCHOOL in MongoDB: ${sriKrishnaUsers}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
