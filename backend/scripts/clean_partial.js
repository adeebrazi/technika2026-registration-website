const mongoose = require('mongoose');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));
  
  const twoMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentGUsers = await User.find({ source: 'google_form', createdAt: { $gte: twoMinutesAgo } });
  console.log('Recent gform users created:', recentGUsers.map(u => ({ id: u.registrationId, name: u.name, created: u.createdAt })));
  
  for (const u of recentGUsers) {
    await Registration.deleteMany({ registrationId: u.registrationId });
    await User.deleteOne({ _id: u._id });
  }
  console.log('Cleaned up recent partial creations.');
  
  const count = await User.countDocuments({ source: 'google_form' });
  console.log('Total google_form users in DB now:', count);
  await mongoose.disconnect();
}
clean().catch(console.error);
