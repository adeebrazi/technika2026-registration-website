const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function check() {
  await connectDB();
  const db = mongoose.connection.db;
  
  const User = require('../models/User');
  const websiteUsers = await User.find({ source: 'website' }).sort({ createdAt: 1 }).lean();
  console.log('Website users count in DB:', websiteUsers.length);

  // Let's also check all users
  const allUsers = await User.find({}).sort({ createdAt: 1 }).lean();
  console.log('Total users in DB:', allUsers.length);
  
  // Print summary of website users
  console.log('--- Website Users in MongoDB ---');
  websiteUsers.forEach((u, i) => {
    console.log(`${i+1}. [${u.registrationId}] ${u.fullName} | ${u.email} | ${u.phone} | Created: ${u.createdAt}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
