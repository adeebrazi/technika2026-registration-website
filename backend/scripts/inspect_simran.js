const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

async function inspectSimran() {
  await connectDB();
  const u = await User.findOne({ name: /Simran verma/i }).lean();
  console.log('User Simran verma:', u?.registrationId, u?.email);

  if (u) {
    const regs = await Registration.find({ registrationId: u.registrationId }).lean();
    console.log(`Registered for ${regs.length} events:`);
    for (const r of regs) {
      const ev = await Event.findOne({ eventId: r.eventId }).lean();
      console.log(`  - ${ev?.name} (${r.eventId}) [Type: ${r.registrationType}]`);
    }
  }
  process.exit(0);
}
inspectSimran().catch(console.error);
