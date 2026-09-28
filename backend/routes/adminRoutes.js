const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyAdminToken, authorizeRoles } = require('../middleware/role');
const User = require('../models/User');
const Team = require('../models/Team');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// Parse env users string: "admin@test.com:pass1,admin2@test.com:pass2"
const parseEnvUsers = (envStr) => {
  if (!envStr) return [];
  return envStr.split(',').map(pair => {
    const [email, password] = pair.split(':');
    return { email: email?.trim(), password: password?.trim() };
  });
};

// Known name mappings for team members / coordinators / admins
const ADMIN_PROFILES = {
  'adeeb@technika2026.online': { name: 'Adeeb Razi', designation: 'Administration' },
  'anjali@technika2026.online': { name: 'Anjali Kumari', designation: 'Administration' },
  'mamathav@technika2026.online': { name: 'Prof. Mamatha V', designation: 'Faculty Coordinator' },
  'viranshuk@technika2026.online': { name: 'Viranshu Kumar', designation: 'Student Coordinator' },
  'rashida@technika2026.online': { name: 'Rashid Ali', designation: 'Student Coordinator' },
  'divyap@technika2026.online': { name: 'Divya Prakash', designation: 'Student Coordinator' },
  'premnaths@technika2026.online': { name: 'Prem Nath Sharma', designation: 'Student Coordinator' },
  'sayantanid@technika2026.online': { name: 'Sayantani Das', designation: 'Student Coordinator' },
  'astikp@technika2026.online': { name: 'Astik Pandey', designation: 'Student Coordinator' },
  'sonalim@technika2026.online': { name: 'Sonali Mahato', designation: 'Student Coordinator' },
  'nikitam@technika2026.online': { name: 'Nikita Kumari', designation: 'Student Coordinator' },
  'aadityas@technika2026.online': { name: 'Aaditya Sharma', designation: 'Student Coordinator' },
  'sanchita@technika2026.online': { name: 'Sanchit Agarwal', designation: 'Student Coordinator' },
  'harshp@technika2026.online': { name: 'Harsh Prasad', designation: 'Student Coordinator' },
  'ishikas@technika2026.online': { name: 'Ishika Singh', designation: 'Student Coordinator' },
  'ankitr@technika2026.online': { name: 'Ankit Raj', designation: 'Student Coordinator' },
  'ssumanr@technika2026.online': { name: 'S Suman Roy', designation: 'Student Coordinator' },
  'princek@technika2026.online': { name: 'Prince Kumar', designation: 'Student Coordinator' },
  'anishs@technika2026.online': { name: 'Anish Singh', designation: 'Student Coordinator' },
  'rishavs@technika2026.online': { name: 'Rishav Sharma', designation: 'Student Coordinator' },
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

const getRoleDesignation = (roleKey, requestedRole) => {
  if (requestedRole && ['Faculty Coordinator', 'Administration', 'Student Coordinator'].includes(requestedRole)) {
    return requestedRole;
  }
  if (roleKey === 'admin') return 'Administration';
  if (roleKey === 'faculty') return 'Faculty Coordinator';
  if (roleKey === 'coordinator') return 'Student Coordinator';
  return 'Staff Member';
};

// @route   POST /api/admin/login
// @desc    Admin authentication with role and designation
// @access  Public
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  // Load from env
  const rolesMap = {
    admin: parseEnvUsers(process.env.ADMIN_USERS),
    faculty: parseEnvUsers(process.env.FACULTY_USERS),
    coordinator: parseEnvUsers(process.env.COORDINATOR_USERS),
    volunteer: parseEnvUsers(process.env.VOLUNTEER_USERS)
  };

  const roleKeyMap = {
    'Administration': 'admin',
    'Faculty Coordinator': 'faculty',
    'Student Coordinator': 'coordinator',
    'admin': 'admin',
    'faculty': 'faculty',
    'coordinator': 'coordinator'
  };

  const requestedKey = role ? roleKeyMap[role] : null;

  let matchedRole = null;

  // 1. If role specified, test matching in that specific role
  if (requestedKey && rolesMap[requestedKey]) {
    const userInRole = rolesMap[requestedKey].find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass);
    if (userInRole) {
      matchedRole = requestedKey;
    }
  }

  // 2. Special case: If user picked 'Faculty Coordinator' or 'Administration' and is in admin users
  if (!matchedRole && requestedKey === 'faculty') {
    const userInAdmin = rolesMap.admin.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass);
    if (userInAdmin) {
      matchedRole = 'faculty';
    }
  }

  // 3. Fallback: match any role if not matched above
  if (!matchedRole) {
    for (const [rKey, users] of Object.entries(rolesMap)) {
      const u = users.find(user => user.email.toLowerCase() === cleanEmail && user.password === cleanPass);
      if (u) {
        matchedRole = rKey;
        break;
      }
    }
  }

  if (!matchedRole) {
    return res.status(401).json({ message: 'Invalid credentials or unauthorized role' });
  }

  const known = ADMIN_PROFILES[cleanEmail];
  const displayName = known?.name || formatNameFromEmail(cleanEmail);
  const finalDesignation = role ? role : (known?.designation || getRoleDesignation(matchedRole));

  // Create token
  const payload = {
    email: cleanEmail,
    role: matchedRole,
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
        role: matchedRole,
        name: displayName,
        designation: finalDesignation
      });
    }
  );
});

// @route   GET /api/admin/users
// @desc    Get all users with their registrations
// @access  Private (All Admin Roles)
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
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

      return {
        ...user.toObject(),
        registeredEvents
      };
    }));

    res.json(usersWithEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/teams
// @desc    Get all teams
// @access  Private (All Admin Roles)
router.get('/teams', verifyAdminToken, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('eventId', 'name category')
      .populate('leaderId', 'name email whatsapp institution')
      .sort({ createdAt: -1 });
      
    // Fetch members for each team
    const TeamMember = require('../models/TeamMember');
    const teamsWithMembers = await Promise.all(teams.map(async (team) => {
      const members = await TeamMember.find({ teamId: team.teamId })
        .populate('userId', 'name email whatsapp institution');
      return {
        ...team.toObject(),
        members
      };
    }));

    res.json(teamsWithMembers);
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

module.exports = router;
