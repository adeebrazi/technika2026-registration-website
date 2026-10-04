const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TRACK_FILE = path.join(__dirname, 'loadtest_100_tracked.json');

async function deleteLoadTestRegistrations() {
  console.log('====================================================');
  console.log('     CLEANUP: DELETING ALL LOAD TEST REGISTRATIONS  ');
  console.log('====================================================');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas.');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }));
  const Team = mongoose.model('Team', new mongoose.Schema({}, { strict: false }));
  const TeamMember = mongoose.model('TeamMember', new mongoose.Schema({}, { strict: false }));
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

  let trackedRegIds = [];
  let trackedTeamIds = [];
  let trackedEmails = [];

  if (fs.existsSync(TRACK_FILE)) {
    try {
      const trackData = JSON.parse(fs.readFileSync(TRACK_FILE, 'utf8'));
      trackedRegIds = trackData.registrationIds || [];
      trackedTeamIds = trackData.teamIds || [];
      trackedEmails = trackData.emails || [];
      console.log(`Loaded tracking file with ${trackedRegIds.length} registration IDs.`);
    } catch (e) {
      console.warn('Failed reading tracking file, falling back to query regex:', e.message);
    }
  }

  // Double safeguard: find all users with loadtest email pattern or tracked IDs
  const query = {
    $or: [
      { email: { $regex: /^loadtest\./i } },
      { name: { $regex: /^LoadTest/i } }
    ]
  };

  if (trackedRegIds.length > 0) {
    query.$or.push({ registrationId: { $in: trackedRegIds } });
  }
  if (trackedEmails.length > 0) {
    query.$or.push({ email: { $in: trackedEmails } });
  }

  const usersToDelete = await User.find(query);
  const foundRegIds = Array.from(new Set([
    ...trackedRegIds,
    ...usersToDelete.map(u => u.registrationId).filter(Boolean)
  ]));

  console.log(`Found ${usersToDelete.length} load test users to delete.`);
  console.log(`Associated Registration IDs: ${foundRegIds.length}`);

  // Safeguard: Ensure 2UTGMG is NEVER deleted
  const safeRegIds = foundRegIds.filter(id => id !== '2UTGMG');

  // Find all teams created by these users
  const teamsToDelete = await Team.find({
    $or: [
      { leaderId: { $in: safeRegIds } },
      { teamId: { $in: trackedTeamIds } }
    ]
  });
  const allTeamIds = Array.from(new Set([
    ...trackedTeamIds,
    ...teamsToDelete.map(t => t.teamId)
  ]));

  // 1. Delete TeamMembers
  const memberRes = await TeamMember.deleteMany({
    $or: [
      { userId: { $in: safeRegIds } },
      { teamId: { $in: allTeamIds } }
    ]
  });

  // 2. Delete Teams
  const teamRes = await Team.deleteMany({
    $or: [
      { teamId: { $in: allTeamIds } },
      { leaderId: { $in: safeRegIds } }
    ]
  });

  // 3. Delete Registrations
  const regRes = await Registration.deleteMany({
    registrationId: { $in: safeRegIds }
  });

  // 4. Delete Notifications
  const notifRes = await Notification.deleteMany({
    recipientId: { $in: safeRegIds }
  });

  // 5. Delete Users
  const userRes = await User.deleteMany({
    $and: [
      { registrationId: { $ne: '2UTGMG' } },
      {
        $or: [
          { registrationId: { $in: safeRegIds } },
          { email: { $regex: /^loadtest\./i } },
          { name: { $regex: /^LoadTest/i } }
        ]
      }
    ]
  });

  console.log('----------------------------------------------------');
  console.log(`✔ Users Deleted        : ${userRes.deletedCount}`);
  console.log(`✔ Registrations Deleted: ${regRes.deletedCount}`);
  console.log(`✔ Teams Deleted        : ${teamRes.deletedCount}`);
  console.log(`✔ Team Members Deleted : ${memberRes.deletedCount}`);
  console.log(`✔ Notifications Deleted: ${notifRes.deletedCount}`);
  console.log('----------------------------------------------------');

  // Verify remaining users
  const remaining = await User.find({}, { registrationId: 1, name: 1, email: 1 });
  console.log('REMAINING ACTIVE USERS IN DATABASE:');
  console.log(JSON.stringify(remaining, null, 2));

  // Remove or archive tracking file
  if (fs.existsSync(TRACK_FILE)) {
    const archivePath = path.join(__dirname, `loadtest_cleaned_${Date.now()}.json`);
    fs.renameSync(TRACK_FILE, archivePath);
    console.log(`✔ Tracking file archived to: ${archivePath}`);
  }

  console.log('\n✔ All load test data successfully and safely cleaned up!');
  process.exit(0);
}

deleteLoadTestRegistrations().catch(err => {
  console.error('Error deleting load test data:', err);
  process.exit(1);
});
