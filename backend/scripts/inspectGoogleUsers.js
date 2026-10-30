const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('../models/User');
    const Registration = require('../models/Registration');
    const Event = require('../models/Event');

    const googleUsers = await User.find({ source: 'google_form' }).sort({ createdAt: 1 });
    console.log(`Found ${googleUsers.length} google_form users in MongoDB.`);

    if (googleUsers.length > 0) {
      console.log('Sample Google Form user:');
      console.log({
        registrationId: googleUsers[0].registrationId,
        name: googleUsers[0].name,
        email: googleUsers[0].email,
        institution: googleUsers[0].institution,
        paymentUTR: googleUsers[0].paymentUTR,
        screenshot: googleUsers[0].paymentScreenshotUrl,
      });

      const userRegs = await Registration.find({ registrationId: googleUsers[0].registrationId });
      console.log(`Events registered for ${googleUsers[0].registrationId}: ${userRegs.length}`);
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

