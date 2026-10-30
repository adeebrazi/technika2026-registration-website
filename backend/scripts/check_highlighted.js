const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

async function checkHighlighted() {
  await connectDB();

  // Find user who selected Fire Free Cooking
  const ffc = await Event.findOne({ name: /Fire Free Cooking/i });
  console.log('Event Fire Free Cooking:', ffc ? ffc.eventId : 'NOT FOUND');

  if (ffc) {
    const regs = await Registration.find({ eventId: ffc.eventId }).lean();
    console.log(`Registrations for Fire Free Cooking: ${regs.length}`);
    for (const r of regs) {
      const u = await User.findOne({ registrationId: r.registrationId }).lean();
      if (u) {
        console.log(`  -> User: [${u.registrationId}] ${u.name} (source: ${u.source})`);
      }
    }
  }

  // Find user who selected Red Tech AND Project Model Exhibition
  const rt = await Event.findOne({ name: /Red Tech/i });
  const pme = await Event.findOne({ name: /Project Model Exhibition/i });

  console.log('Red Tech Event:', rt?.eventId, '| Project Model Event:', pme?.eventId);

  process.exit(0);
}

checkHighlighted().catch(console.error);
