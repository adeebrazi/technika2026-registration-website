const mongoose = require('mongoose');
const Registration = require('./models/Registration');
const User = require('./models/User');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:59224/');
  const regs = await Registration.find();
  console.log(`Total registrations: ${regs.length}`);
  regs.forEach(r => {
    console.log(`User: ${r.registrationId}, Event: ${r.eventId}, Team: ${r.teamId}, Type: ${r.registrationType}, Status: ${r.status}`);
  });
  
  const users = await User.find();
  console.log(`Total users: ${users.length}`);
  users.forEach(u => {
    console.log(`User ID: ${u.registrationId}, Name: ${u.name}, Email: ${u.email}`);
  });
  
  process.exit(0);
}

run().catch(console.error);
