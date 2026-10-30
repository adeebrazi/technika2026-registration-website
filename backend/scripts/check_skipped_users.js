const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');

async function checkWhySkipped() {
  await connectDB();
  const emails = ['sahilkumarsingh7971@gmail.com', 'dasshreyas780@gmail.com', 'faizafatima441@gmail.com'];
  for (const em of emails) {
    const users = await User.find({ email: em }).lean();
    console.log(`Email: ${em}`);
    users.forEach(u => console.log(`  [${u.registrationId}] ${u.name} | source: ${u.source} | UTR: ${u.paymentUTR}`));
  }
  process.exit(0);
}
checkWhySkipped().catch(console.error);
