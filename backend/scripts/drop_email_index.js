const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function dropEmailIndex() {
  await connectDB();
  const db = mongoose.connection.db;

  try {
    await db.collection('users').dropIndex('email_1');
    console.log('Successfully dropped unique index "email_1" from users collection.');
  } catch (err) {
    console.log('Drop index result/error:', err.message);
  }

  // Also tag any users with source: null as source: 'website'
  const updateRes = await db.collection('users').updateMany(
    { source: { $nin: ['google_form', 'website'] } },
    { $set: { source: 'website' } }
  );
  console.log(`Updated ${updateRes.modifiedCount} users to source: 'website'.`);

  // Verify indexes
  const indexes = await db.collection('users').indexes();
  console.log('Remaining indexes on users:');
  indexes.forEach(idx => {
    console.log(idx.name, idx.key, idx.unique ? '(UNIQUE)' : '');
  });

  await mongoose.disconnect();
}

dropEmailIndex().catch(console.error);
