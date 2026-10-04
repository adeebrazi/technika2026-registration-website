const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyAdminToken, authorizeRoles } = require('../middleware/role');
const User = require('../models/User');
const Team = require('../models/Team');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// Parse env users string: supports both "Name:email:password" and "email:password"
const parseEnvUsers = (envStr) => {
  if (!envStr) return [];
  return envStr.split(',').map(entry => {
    const parts = entry.split(':').map(p => p.trim());
    if (parts.length >= 3) {
      return { name: parts[0], email: parts[1].toLowerCase(), password: parts[2] };
    } else if (parts.length === 2) {
      return { name: null, email: parts[0].toLowerCase(), password: parts[1] };
    }
    return null;
  }).filter(Boolean);
};

// Fallback known name mappings synced with Main Website (organisers.json)
const ADMIN_PROFILES = {
  // Convenors & Faculty Coordinators
  'arvindk@technika2026.online': { name: 'Dr. Arvind Kumar Pandey', designation: 'Faculty Coordinator' },
  'ashwinik@technika2026.online': { name: 'Dr. Ashwini Kumar', designation: 'Faculty Coordinator' },
  'mamathav@technika2026.online': { name: 'Prof. Mamatha Vayelapelli', designation: 'Faculty Coordinator' },
  'viranshuk@technika2026.online': { name: 'Dr. Viranshu Kumar', designation: 'Faculty Coordinator' },
  'rashida@technika2026.online': { name: 'Prof. Syed Rashid Anwar', designation: 'Faculty Coordinator' },
  'divyap@technika2026.online': { name: 'Prof. Divya Paikaray', designation: 'Faculty Coordinator' },
  'premnaths@technika2026.online': { name: 'Dr. Prem Nath Suman', designation: 'Faculty Coordinator' },
  'sayantanid@technika2026.online': { name: 'Prof. Sayantani De', designation: 'Faculty Coordinator' },
  'astikp@technika2026.online': { name: 'Prof. Astik Pradhan', designation: 'Faculty Coordinator' },
  'padmajat@technika2026.online': { name: 'Dr. Padmaja Tripathy', designation: 'Faculty Coordinator' },

  // Administration
  'adeeb@technika2026.online': { name: 'Adeeb Razi', designation: 'Administration' },
  'anjali@technika2026.online': { name: 'Anjali Singh', designation: 'Administration' },

  // Student Coordinators
  'sonalim@technika2026.online': { name: 'Sonali Mahato', designation: 'Student Coordinator' },
  'nikitam@technika2026.online': { name: 'Nikita Mishra', designation: 'Student Coordinator' },
  'aadityas@technika2026.online': { name: 'Aaditya Singh', designation: 'Student Coordinator' },
  'sohailk@technika2026.online': { name: 'Sohail Khan', designation: 'Student Coordinator' },
  'sanchita@technika2026.online': { name: 'Sanchit Agarwal', designation: 'Student Coordinator' },
  'harshp@technika2026.online': { name: 'Harsh Pathak', designation: 'Student Coordinator' },
  'ishikas@technika2026.online': { name: 'Ishika Shrivastava', designation: 'Student Coordinator' },
  'ankitr@technika2026.online': { name: 'Ankit Raj', designation: 'Student Coordinator' },
  'ssumanr@technika2026.online': { name: 'S Suman Rao', designation: 'Student Coordinator' },
  'princek@technika2026.online': { name: 'Prince Kumar', designation: 'Student Coordinator' },
  'anishs@technika2026.online': { name: 'Anish Kr Singh', designation: 'Student Coordinator' },
  'rishavs@technika2026.online': { name: 'Rishav Kr Singh', designation: 'Student Coordinator' },
  'saraswatik@technika2026.online': { name: 'Saraswati Kumari', designation: 'Student Coordinator' }
};

const formatNameFromEmail = (email) => {
  if (!email) return 'Admin User';
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

const ROLE_NAME_TO_KEY = {
  'Faculty Coordinator': 'faculty',
  'Administration': 'admin',
  'Student Coordinator': 'coordinator'
};

const ROLE_KEY_TO_TITLE = {
  'faculty': 'Faculty Coordinator',
  'admin': 'Administration',
  'coordinator': 'Student Coordinator'
};

// @route   POST /api/admin/login
// @desc    Admin authentication with strict role verification
// @access  Public
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  // Load role groups from env
  const rolesMap = {
    faculty: parseEnvUsers(process.env.FACULTY_USERS),
    admin: parseEnvUsers(process.env.ADMIN_USERS),
    coordinator: parseEnvUsers(process.env.COORDINATOR_USERS),
    volunteer: parseEnvUsers(process.env.VOLUNTEER_USERS)
  };

  // Find which pool this user actually belongs to
  let foundUser = null;
  let actualRoleKey = null;

  for (const [rKey, usersList] of Object.entries(rolesMap)) {
    const match = usersList.find(u => u.email === cleanEmail && u.password === cleanPass);
    if (match) {
      foundUser = match;
      actualRoleKey = rKey;
      break;
    }
  }

  // If no credentials matched in any pool
  if (!foundUser) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // STRICT ROLE ENFORCEMENT:
  // If user selected a specific role on frontend, it MUST match their assigned role in .env!
  const requestedRoleKey = role ? ROLE_NAME_TO_KEY[role] : null;

  if (requestedRoleKey && requestedRoleKey !== actualRoleKey) {
    const actualTitle = ROLE_KEY_TO_TITLE[actualRoleKey] || actualRoleKey;
    const requestedTitle = role;
    return res.status(403).json({
      message: `Access Denied: Your account is registered as ${actualTitle}. You cannot log in as ${requestedTitle}.`
    });
  }

  const finalRoleKey = actualRoleKey;
  const finalDesignation = ROLE_KEY_TO_TITLE[finalRoleKey] || 'Staff Member';
  
  // Resolve display name:
  // 1. Name specified in .env ("Name:email:pass")
  // 2. Fallback known name from ADMIN_PROFILES
  // 3. Formatted email name
  const displayName = foundUser.name || ADMIN_PROFILES[cleanEmail]?.name || formatNameFromEmail(cleanEmail);

  // Create JWT token
  const payload = {
    email: cleanEmail,
    role: finalRoleKey,
    name: displayName,
    designation: finalDesignation,
    isAdmin: true
  };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '12h' },
    (err, token) => {
      if (err) throw err;
      res.json({
        success: true,
        token,
        role: finalRoleKey,
        name: displayName,
        designation: finalDesignation
      });
    }
  );
});

// @route   POST /api/admin/dashboard-login
// @desc    Dashboard PIN authentication
// @access  Public
router.post('/dashboard-login', (req, res) => {
  const { pin } = req.body;
  const validPin = process.env.DASHBOARD_PIN || '1234';

  if (!pin || pin !== validPin) {
    return res.status(401).json({ message: 'Invalid PIN' });
  }

  jwt.sign(
    { role: 'viewer', name: 'Dashboard Viewer', isAdmin: true },
    process.env.JWT_SECRET,
    { expiresIn: '24h' },
    (err, token) => {
      if (err) throw err;
      res.json({ success: true, token, role: 'viewer' });
    }
  );
});

// @route   GET /api/admin/users
// @desc    Get all users with their registrations (role-filtered)
// @access  Private (All Admin Roles)
// NOTE: Admin & Faculty see FULL details. Student Coordinators see limited data only.
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const requestingRole = req.admin?.role; // 'admin' | 'faculty' | 'coordinator'
    const isFullAccess = (requestingRole === 'admin' || requestingRole === 'faculty');

    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    
    // Fetch all events to construct an in-memory mapping
    const Event = require('../models/Event');
    const events = await Event.find();
    const eventMap = {};
    events.forEach(e => {
      eventMap[e.eventId] = e;
    });

    // Fetch registered events for each user using registrationId
    const usersWithEvents = await Promise.all(users.map(async (user) => {
      const registrations = await Registration.find({ registrationId: user.registrationId });
      
      const registeredEvents = registrations.map(reg => {
        const eventDoc = eventMap[reg.eventId];
        return {
          ...reg.toObject(),
          event: eventDoc ? {
            name: eventDoc.name,
            category: eventDoc.category,
            type: eventDoc.teamAllowed ? 'TEAM' : 'INDIVIDUAL'
          } : null
        };
      });

      // FULL ACCESS: Admin & Faculty — return everything
      if (isFullAccess) {
        return {
          ...user.toObject(),
          registeredEvents
        };
      }

      // LIMITED ACCESS: Student Coordinator — only name, institution, events
      return {
        _id: user._id,
        name: user.name,
        institution: user.institution,
        registeredEvents: registeredEvents.map(re => ({
          _id: re._id,
          event: re.event ? { name: re.event.name } : null
        }))
      };
    }));

    // Include the access level in response so frontend knows what to render
    res.json({ users: usersWithEvents, accessLevel: isFullAccess ? 'full' : 'limited' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/teams
// @desc    Get all teams with event and member details
// @access  Private (All Admin Roles)
// NOTE: Uses manual lookups because all refs are String-based (not ObjectId)
router.get('/teams', verifyAdminToken, async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 });
    
    // Build in-memory maps for events and users (string-keyed)
    const events = await Event.find();
    const eventMap = {};
    events.forEach(e => { eventMap[e.eventId] = e; });

    const allUsers = await User.find().select('-passwordHash');
    const userMap = {};
    allUsers.forEach(u => { userMap[u.registrationId] = u; });

    // Fetch members for each team
    const TeamMember = require('../models/TeamMember');
    const teamsWithDetails = await Promise.all(teams.map(async (team) => {
      const teamObj = team.toObject();
      
      // Resolve event details
      const eventDoc = eventMap[teamObj.eventId];
      teamObj.eventId = eventDoc ? {
        name: eventDoc.name,
        category: eventDoc.category,
        eventId: eventDoc.eventId
      } : { name: 'Unknown Event', category: '', eventId: teamObj.eventId };

      // Resolve leader details
      const leaderDoc = userMap[teamObj.leaderId];
      teamObj.leaderId = leaderDoc ? {
        name: leaderDoc.name,
        email: leaderDoc.email,
        whatsapp: leaderDoc.whatsapp,
        institution: leaderDoc.institution
      } : { name: 'Unknown', email: '', whatsapp: '', institution: '' };

      // Fetch and resolve team members
      const memberDocs = await TeamMember.find({ teamId: teamObj.teamId });
      teamObj.members = memberDocs.map(m => {
        const memberUser = userMap[m.userId];
        return {
          _id: m._id,
          role: m.role,
          userId: memberUser ? {
            name: memberUser.name,
            email: memberUser.email,
            whatsapp: memberUser.whatsapp,
            institution: memberUser.institution
          } : { name: 'Unknown', email: '', whatsapp: '', institution: '' }
        };
      });

      return teamObj;
    }));

    res.json(teamsWithDetails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user and their registrations
// @access  Private (Admin & Faculty Only)
router.delete('/users/:id', verifyAdminToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete registrations
    await Registration.deleteMany({ user: userId });
    
    // We also need to remove them from teams, but for now we just delete user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'User and registrations deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get comprehensive analytics for dashboard
// @access  Public (No login required)
router.get('/analytics', async (req, res) => {
  try {
    // ── 1. Total number of registrations (unique users) ──
    const totalRegistrations = await User.countDocuments();

    // ── 2. Institute-wise breakdown ──
    const instituteAgg = await User.aggregate([
      { $group: { _id: '$institution', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const instituteWise = instituteAgg.map(i => ({ institute: i._id || 'Unknown', count: i.count }));
    const totalInstitutes = instituteAgg.length;

    // ── 3. Event-wise registration counts ──
    const events = await Event.find();
    const eventMap = {};
    events.forEach(e => { eventMap[e.eventId] = e.name; });

    const eventAgg = await Registration.aggregate([
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const eventWise = eventAgg.map(e => ({
      eventId: e._id,
      eventName: eventMap[e._id] || e._id,
      count: e.count
    }));
    const maxEvent = eventWise.length > 0 ? eventWise[0] : null;
    const minEvent = eventWise.length > 0 ? eventWise[eventWise.length - 1] : null;

    // ── 4. Gender distribution ──
    const genderAgg = await User.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);
    const genderDistribution = {};
    genderAgg.forEach(g => { genderDistribution[g._id || 'Unknown'] = g.count; });

    // ── 5. Course-wise distribution ──
    const courseAgg = await User.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const courseDistribution = courseAgg.map(c => ({ course: c._id || 'Unknown', count: c.count }));

    // ── 6. Daily registration trend (last 30 days) ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyAgg = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    const dailyTrend = dailyAgg.map(d => ({ date: d._id, count: d.count }));

    // ── 7. Age Category Distribution ──
    const ageAgg = await User.aggregate([
      { $match: { age: { $exists: true, $ne: null } } },
      { $group: { _id: '$age', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    let under18 = 0, age18_20 = 0, age21_23 = 0, age24plus = 0;
    let totalAgeSum = 0, totalAgeCount = 0;
    const detailedAge = [];

    ageAgg.forEach(a => {
      const ageNum = parseInt(a._id);
      if (!isNaN(ageNum) && ageNum > 0) {
        totalAgeSum += ageNum * a.count;
        totalAgeCount += a.count;
        detailedAge.push({ age: `${ageNum} yrs`, count: a.count });

        if (ageNum < 18) under18 += a.count;
        else if (ageNum <= 20) age18_20 += a.count;
        else if (ageNum <= 23) age21_23 += a.count;
        else age24plus += a.count;
      }
    });

    const averageAge = totalAgeCount > 0 ? (totalAgeSum / totalAgeCount).toFixed(1) : '0';
    const ageDistribution = [
      { category: '< 18 yrs', count: under18, share: totalAgeCount > 0 ? Number(((under18 / totalAgeCount) * 100).toFixed(1)) : 0 },
      { category: '18 - 20 yrs', count: age18_20, share: totalAgeCount > 0 ? Number(((age18_20 / totalAgeCount) * 100).toFixed(1)) : 0 },
      { category: '21 - 23 yrs', count: age21_23, share: totalAgeCount > 0 ? Number(((age21_23 / totalAgeCount) * 100).toFixed(1)) : 0 },
      { category: '24+ yrs', count: age24plus, share: totalAgeCount > 0 ? Number(((age24plus / totalAgeCount) * 100).toFixed(1)) : 0 }
    ];

    // ── 8. Event Categories Breakdown (Technical, Cultural, Creative) ──
    const eventCategoryMap = {};
    events.forEach(e => {
      eventCategoryMap[e.eventId] = e.category || 'Other';
    });

    const eventTypeCounts = {
      Technical: 0,
      Cultural: 0,
      Creative: 0,
      Other: 0
    };
    let totalEventRegistrations = 0;

    eventAgg.forEach(e => {
      let cat = eventCategoryMap[e._id];
      if (!cat || cat === 'Other') {
        if (e._id.startsWith('TECH_')) cat = 'Technical';
        else if (e._id.startsWith('CUL_')) cat = 'Cultural';
        else if (e._id.startsWith('CRE_')) cat = 'Creative';
        else cat = 'Other';
      }
      eventTypeCounts[cat] = (eventTypeCounts[cat] || 0) + e.count;
      totalEventRegistrations += e.count;
    });

    const eventTypeBreakdown = [
      {
        category: 'Technical',
        count: eventTypeCounts.Technical || 0,
        share: totalEventRegistrations > 0 ? Number((((eventTypeCounts.Technical || 0) / totalEventRegistrations) * 100).toFixed(1)) : 0,
        color: '#22d3ee'
      },
      {
        category: 'Cultural',
        count: eventTypeCounts.Cultural || 0,
        share: totalEventRegistrations > 0 ? Number((((eventTypeCounts.Cultural || 0) / totalEventRegistrations) * 100).toFixed(1)) : 0,
        color: '#fbbf24'
      },
      {
        category: 'Creative',
        count: eventTypeCounts.Creative || 0,
        share: totalEventRegistrations > 0 ? Number((((eventTypeCounts.Creative || 0) / totalEventRegistrations) * 100).toFixed(1)) : 0,
        color: '#ec4899'
      }
    ];

    res.json({
      totalRegistrations,
      instituteWise,
      totalInstitutes,
      eventWise,
      maxEvent,
      minEvent,
      genderDistribution,
      courseDistribution,
      dailyTrend,
      ageDistribution,
      averageAge,
      detailedAge,
      eventTypeBreakdown,
      totalEventRegistrations
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

module.exports = router;
