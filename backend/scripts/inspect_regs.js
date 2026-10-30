const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function inspectRegistrations() {
  await connectDB();
  const db = mongoose.connection.db;

  const userCount = await db.collection('users').countDocuments();
  const regCount = await db.collection('registrations').countDocuments();
  const uniqueRegUsers = await db.collection('registrations').distinct('registrationId');

  console.log('User documents in users collection:', userCount);
  console.log('Registration documents in registrations collection:', regCount);
  console.log('Unique registrationIds in registrations collection:', uniqueRegUsers.length);

  await mongoose.disconnect();
}

inspectRegistrations().catch(console.error);
