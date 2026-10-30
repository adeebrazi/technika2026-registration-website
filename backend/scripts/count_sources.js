const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');

async function count() {
  await connectDB();
  const counts = await User.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
  console.log('Source counts in MongoDB:', counts);
  process.exit(0);
}
count();
