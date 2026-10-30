const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

async function checkEventRegistrations() {
  await connectDB();

  // Find all google_form users
  const gUsers = await User.find({ source: 'google_form' }).lean();
  console.log(`Total google_form users in DB: ${gUsers.length}`);

  const gUserIds = gUsers.map(u => u.registrationId);
  const registrations = await Registration.find({ registrationId: { $in: gUserIds } }).lean();
  console.log(`Total event registrations created for google_form users: ${registrations.length}`);

  const evCountsByUser = {};
  registrations.forEach(r => {
    evCountsByUser[r.registrationId] = (evCountsByUser[r.registrationId] || 0) + 1;
  });

  console.log('Sample user event registration counts:');
  gUsers.slice(0, 10).forEach(u => {
    console.log(`[${u.registrationId}] ${u.name} -> ${evCountsByUser[u.registrationId] || 0} events registered`);
  });

  // Check event breakdown across all google_form users
  const events = await Event.find().lean();
  const eventNameMap = {};
  events.forEach(e => { eventNameMap[e.eventId] = e.name; });

  const eventCounts = {};
  registrations.forEach(r => {
    const name = eventNameMap[r.eventId] || r.eventId;
    eventCounts[name] = (eventCounts[name] || 0) + 1;
  });

  console.log('\nTop 15 registered events among Google Form users:');
  Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([name, count], i) => {
      console.log(`${i+1}. ${name}: ${count} participants`);
    });

  process.exit(0);
}

checkEventRegistrations().catch(console.error);
