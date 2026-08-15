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

// @route   POST /api/admin/login
// @desc    Admin authentication
// @access  Public
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Load from env
  const rolesMap = {
    admin: parseEnvUsers(process.env.ADMIN_USERS),
    faculty: parseEnvUsers(process.env.FACULTY_USERS),
    coordinator: parseEnvUsers(process.env.COORDINATOR_USERS),
    volunteer: parseEnvUsers(process.env.VOLUNTEER_USERS)
  };

  let matchedRole = null;

  for (const [role, users] of Object.entries(rolesMap)) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      matchedRole = role;
      break;
    }
  }

  if (!matchedRole) {
    return res.status(401).json({ message: 'Invalid credentials or no permission' });
  }

  // Create token
  const payload = {
    email,
    role: matchedRole,
    isAdmin: true
  };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '12h' },
    (err, token) => {
      if (err) throw err;
      res.json({ success: true, token, role: matchedRole });
    }
  );
});

// @route   GET /api/admin/users
// @desc    Get all users with their registrations
// @access  Private (All Admin Roles)
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    
    // Fetch registered events for each user
    const usersWithEvents = await Promise.all(users.map(async (user) => {
      const registrations = await Registration.find({ user: user._id }).populate('event', 'name category type');
      return {
        ...user.toObject(),
        registeredEvents: registrations
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
