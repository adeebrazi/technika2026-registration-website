const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function inspect() {
  await connectDB();
  const User = require('../models/User');
  
  const sources = await User.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } }
  ]);
  console.log('Sources breakdown:', sources);

  const sampleUsers = await User.find({}).limit(5).lean();
  console.log('Sample user keys:', Object.keys(sampleUsers[0]));
  console.log('Sample user 0:', sampleUsers[0]);

  await mongoose.disconnect();
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
