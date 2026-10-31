const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const mayankUsers = await User.find({ name: { $regex: 'Mayank Kumar Sharma', $options: 'i' } });
  console.log('Mayank users in DB:', mayankUsers.map(u => ({ id: u.registrationId, name: u.name, email: u.email, source: u.source, createdAt: u.createdAt, inst: u.institution })));
  
  const vriddhiUsers = await User.find({ name: { $regex: 'Vriddhi', $options: 'i' } });
  console.log('Vriddhi users in DB:', vriddhiUsers.map(u => ({ id: u.registrationId, name: u.name, email: u.email, source: u.source, createdAt: u.createdAt, inst: u.institution })));

  const totalGoogleForm = await User.countDocuments({ source: 'google_form' });
  const totalWebsite = await User.countDocuments({ source: 'website' });
  const totalUsers = await User.countDocuments();
  console.log({ totalUsers, totalGoogleForm, totalWebsite });

  // Check how many names appear multiple times in DB
  const users = await User.find({ source: 'google_form' }, 'name registrationId email createdAt');
  const nameMap = {};
  for (const u of users) {
    const key = (u.name || '').trim().toLowerCase();
    if (!nameMap[key]) nameMap[key] = [];
    nameMap[key].push(u);
  }
  const multi = Object.entries(nameMap).filter(([k, list]) => list.length > 1);
  console.log('Unique names in google_form:', Object.keys(nameMap).length);
  console.log('Names with multiple registrations in DB:', multi.length);
  if (multi.length > 0) {
    console.log('Sample multiple registrations in DB:', multi.slice(0, 5).map(([k, list]) => ({
      name: k,
      entries: list.map(x => ({ id: x.registrationId, email: x.email, created: x.createdAt }))
    })));
  }

  await mongoose.disconnect();
}
check().catch(console.error);
