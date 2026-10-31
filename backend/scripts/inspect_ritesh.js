const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const googleUsers = await User.find({ source: 'google_form' }).sort({ createdAt: 1 });
  console.log('Total google_form users in DB:', googleUsers.length);
  
  const names = {};
  const emails = {};
  const ids = {};
  
  googleUsers.forEach(u => {
    ids[u.registrationId] = (ids[u.registrationId] || 0) + 1;
    const n = (u.name || '').trim().toLowerCase();
    names[n] = (names[n] || 0) + 1;
    const e = (u.email || '').trim().toLowerCase();
    emails[e] = (emails[e] || 0) + 1;
  });
  
  const dupIds = Object.entries(ids).filter(([k, v]) => v > 1);
  const dupNames = Object.entries(names).filter(([k, v]) => v > 1);
  
  console.log('Duplicate IDs in DB:', dupIds);
  console.log('Duplicate Names in DB:', dupNames);
  
  const rUsers = await User.find({ name: /ritesh kumar/i });
  console.log('Ritesh Kumar entries in DB:', rUsers.map(u => ({ id: u.registrationId, name: u.name, email: u.email, phone: u.whatsapp, inst: u.institution, utr: u.paymentUTR, created: u.createdAt })));

  await mongoose.disconnect();
}
check().catch(console.error);
