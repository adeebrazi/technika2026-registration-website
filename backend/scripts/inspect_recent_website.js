const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function inspectLast() {
  await connectDB();
  const User = require('../models/User');

  const users = await User.find({ source: { $ne: 'google_form' } }).sort({ createdAt: -1 }).limit(5).lean();
  console.log('Most recent website users in Mongo:');
  users.forEach(u => {
    console.log(`[${u.registrationId}] ${u.name} | ${u.email} | Created: ${u.createdAt}`);
  });

  await mongoose.disconnect();
}

inspectLast().catch(console.error);
