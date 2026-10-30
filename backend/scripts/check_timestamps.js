const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');

async function checkTimestamps() {
  await connectDB();
  const users = await User.find({
    registrationId: { $in: ['QXWHLD', 'J3EIQI', '26750I'] }
  }).lean();
  users.forEach(u => {
    console.log(`[${u.registrationId}] ${u.name} | CreatedAt: ${u.createdAt} | source: ${u.source}`);
  });
  process.exit(0);
}
checkTimestamps().catch(console.error);
