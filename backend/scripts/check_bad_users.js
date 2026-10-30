const path = require('path');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });
const connectDB = require('../config/db');
const User = require('../models/User');

async function testUsers() {
  await connectDB();
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  console.log('Total users fetched:', users.length);
  const bad = users.filter(u => !u.registrationId || !u.name);
  console.log('Users missing registrationId or name:', bad.length);
  if (bad.length > 0) console.log(bad);
  process.exit(0);
}

testUsers().catch(console.error);
