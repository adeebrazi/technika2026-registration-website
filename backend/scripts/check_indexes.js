const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function checkIndexes() {
  await connectDB();
  const db = mongoose.connection.db;

  const indexes = await db.collection('users').indexes();
  console.log('Current indexes on users collection:');
  indexes.forEach(idx => {
    console.log(idx.name, idx.key, idx.unique ? '(UNIQUE)' : '');
  });

  await mongoose.disconnect();
}

checkIndexes().catch(console.error);
