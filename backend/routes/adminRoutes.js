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
