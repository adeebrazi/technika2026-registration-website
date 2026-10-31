const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const noTs = await User.find({ source: 'google_form', formTimestamp: null });
  console.log('Google form users without formTimestamp:', noTs.map(u => ({ id: u.registrationId, name: u.name, email: u.email, shot: u.paymentScreenshotUrl, created: u.createdAt })));
  await mongoose.disconnect();
}
check().catch(console.error);
