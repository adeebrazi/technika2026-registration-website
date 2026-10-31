const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyAdminToken, authorizeRoles } = require('../middleware/role');
const User = require('../models/User');
const Team = require('../models/Team');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const RolePermission = require('../models/RolePermission');
const cloudinaryService = require('../services/cloudinaryService');
const vercelService = require('../services/vercelService');
const { sendRegistrationConfirmationEmail } = require('../utils/emailService');

const DEFAULT_PERMISSIONS = {
  faculty: {
    targetKey: 'faculty',
    title: 'Faculty Coordinator',
    canViewParticipants: true,
    canViewContactInfo: true,
    canViewFinancials: true,
    canViewDocuments: true,
    canViewTeams: true,
    canViewAnalytics: true,
    canViewDeveloperHub: false,
    canVerifyPayments: true,
    canDeleteParticipants: false,
    canEditTeams: true,
    canExportCSV: true,
    canCheckInParticipants: true,
    assignedEvents: []
  },
  coordinator: {
    targetKey: 'coordinator',
    title: 'Student Coordinator',
    canViewParticipants: true,
    canViewContactInfo: true,
    canViewFinancials: false,
    canViewDocuments: false,
    canViewTeams: true,
    canViewAnalytics: false,
    canViewDeveloperHub: false,
    canVerifyPayments: false,
    canDeleteParticipants: false,
    canEditTeams: false,
    canExportCSV: false,
    canCheckInParticipants: true,
    assignedEvents: []
  }
};

const getActivePermissions = async (role, email) => {
  if (role === 'admin') {
    return {
      targetKey: 'admin',
      title: 'Administrator',
      canViewParticipants: true,
      canViewContactInfo: true,
      canViewFinancials: true,
      canViewDocuments: true,
      canViewTeams: true,
      canViewAnalytics: true,
      canViewDeveloperHub: true,
      canVerifyPayments: true,
      canDeleteParticipants: true,
      canEditTeams: true,
      canExportCSV: true,
      canCheckInParticipants: true,
      assignedEvents: []
    };
  }

  try {
    if (email) {
      const emailPerm = await RolePermission.findOne({ targetKey: email.toLowerCase() });
      if (emailPerm) return emailPerm.toObject();
    }
    const rolePerm = await RolePermission.findOne({ targetKey: role });
    if (rolePerm) return rolePerm.toObject();
  } catch (err) {
    console.error('Error reading role permissions:', err);
  }

  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.coordinator;
};

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

  // Administration (Only Adeeb Razi)
  'adeeb@technika2026.online': { name: 'Adeeb Razi', designation: 'Administration' },

  // Student Coordinators
  'anjali@technika2026.online': { name: 'Anjali Singh', designation: 'Student Coordinator' },
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
  'aweshh@technika2026.online': { name: 'Awesh Hussain', designation: 'Student Coordinator' }
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
router.post('/login', async (req, res) => {
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

  const userPerms = await getActivePermissions(finalRoleKey, cleanEmail);

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
        designation: finalDesignation,
        permissions: userPerms
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
// @desc    Get all users with their registrations (dynamic permission-filtered)
// @access  Private (All Admin Roles)
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    const requestingRole = req.admin?.role; // 'admin' | 'faculty' | 'coordinator'
    const requestingEmail = req.admin?.email;
    const perms = await getActivePermissions(requestingRole, requestingEmail);

    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    
    // Fetch all events to construct an in-memory mapping
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

      // Filter by assigned events if restricted
      if (perms.assignedEvents && perms.assignedEvents.length > 0) {
        const hasAssignedEvent = registeredEvents.some(re => 
          re.event && perms.assignedEvents.includes(re.event.name)
        );
        if (!hasAssignedEvent) return null;
      }

      // Root Admin has full unfiltered access
      if (requestingRole === 'admin') {
        return {
          ...user.toObject(),
          registeredEvents
        };
      }

      // Dynamic permission filtering based on what Admin configured for Faculty/Coordinator
      const uObj = user.toObject();
      const filteredUser = {
        _id: uObj._id,
        name: uObj.name,
        registrationId: uObj.registrationId,
        institution: uObj.institution,
        course: uObj.course,
        semester: uObj.semester,
        gender: uObj.gender,
        source: uObj.source || 'website',
        createdAt: uObj.createdAt,
        confirmationEmailSent: Boolean(uObj.confirmationEmailSent),
        confirmationEmailSentAt: uObj.confirmationEmailSentAt || null,
        confirmationEmailSentBy: uObj.confirmationEmailSentBy || null,
        qrEmailSent: Boolean(uObj.qrEmailSent),
        qrEmailSentAt: uObj.qrEmailSentAt || null,
        qrEmailSentBy: uObj.qrEmailSentBy || null,
        registeredEvents: registeredEvents.map(re => ({
          _id: re._id,
          eventId: re.eventId,
          event: re.event
        }))
      };

      // CAN VIEW CONTACT INFO
      if (perms.canViewContactInfo) {
        filteredUser.email = uObj.email;
        filteredUser.whatsapp = uObj.whatsapp;
      }

      // CAN VIEW FINANCIALS
      if (perms.canViewFinancials) {
        filteredUser.paymentUTR = uObj.paymentUTR;
        filteredUser.utrEnteredManually = uObj.utrEnteredManually;
        filteredUser.paymentStatus = uObj.paymentStatus;
        filteredUser.isAjuExempt = uObj.isAjuExempt;
      }

      // CAN VIEW DOCUMENTS
      if (perms.canViewDocuments) {
        filteredUser.paymentScreenshotUrl = uObj.paymentScreenshotUrl;
        filteredUser.noDuesSlipUrl = uObj.noDuesSlipUrl;
        filteredUser.collegeIdCardUrl = uObj.collegeIdCardUrl;
      }

      return filteredUser;
    }));

    const finalUsers = usersWithEvents.filter(Boolean);
    const accessLevel = perms.canViewFinancials && perms.canViewDocuments ? 'full' : 'limited';

    res.json({ users: finalUsers, accessLevel, permissions: perms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/permissions
// @desc    Get access permissions matrix for roles and users
// @access  Private (All Authenticated Staff)
router.get('/permissions', verifyAdminToken, async (req, res) => {
  try {
    const dbPerms = await RolePermission.find();
    const permMap = {};
    dbPerms.forEach(p => {
      permMap[p.targetKey] = p.toObject();
    });

    const staffFaculty = Object.entries(ADMIN_PROFILES)
      .filter(([_, p]) => p.designation === 'Faculty Coordinator')
      .map(([email, p]) => ({ email, name: p.name, designation: p.designation }));

    const staffCoordinators = Object.entries(ADMIN_PROFILES)
      .filter(([_, p]) => p.designation === 'Student Coordinator')
      .map(([email, p]) => ({ email, name: p.name, designation: p.designation }));

    res.json({
      success: true,
      faculty: permMap['faculty'] || DEFAULT_PERMISSIONS.faculty,
      coordinator: permMap['coordinator'] || DEFAULT_PERMISSIONS.coordinator,
      customOverrides: dbPerms.filter(p => p.targetKey !== 'faculty' && p.targetKey !== 'coordinator'),
      staffList: {
        faculty: staffFaculty,
        coordinators: staffCoordinators
      },
      currentRole: req.admin?.role,
      userPermissions: await getActivePermissions(req.admin?.role, req.admin?.email)
    });
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/my-permissions
// @desc    Get live active permissions for currently authenticated user
// @access  Private (All Authenticated Staff)
router.get('/my-permissions', verifyAdminToken, async (req, res) => {
  try {
    const perms = await getActivePermissions(req.admin?.role, req.admin?.email);
    res.json({
      success: true,
      permissions: perms,
      role: req.admin?.role,
      email: req.admin?.email,
      name: req.admin?.name
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/permissions
// @desc    Assign access to faculty and student coordinators (what they can see and what they can edit)
// @access  Private (Administrator Only)
router.post('/permissions', verifyAdminToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { targetKey, title, _id, __v, ...permissionsData } = req.body;
    if (!targetKey) {
      return res.status(400).json({ message: 'targetKey is required (e.g. "faculty", "coordinator", or user email)' });
    }

    const defaultTitle = targetKey === 'faculty' ? 'Faculty Coordinator' : (targetKey === 'coordinator' ? 'Student Coordinator' : (ADMIN_PROFILES[targetKey]?.name || targetKey));

    const updated = await RolePermission.findOneAndUpdate(
      { targetKey: targetKey.toLowerCase() },
      {
        $set: {
          targetKey: targetKey.toLowerCase(),
          title: title || defaultTitle,
          ...permissionsData,
          updatedBy: req.admin?.name || 'Administrator',
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: `Access permissions updated successfully for ${updated.title || targetKey}`,
      permission: updated
    });
  } catch (err) {
    console.error('Error saving permissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/permissions/:targetKey
// @desc    Remove an individual override to revert to default role permissions
// @access  Private (Administrator Only)
router.delete('/permissions/:targetKey', verifyAdminToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { targetKey } = req.params;
    if (!targetKey) {
      return res.status(400).json({ message: 'targetKey is required' });
    }

    await RolePermission.deleteOne({ targetKey: targetKey.toLowerCase() });

    res.json({
      success: true,
      message: `Individual override removed. Reverted to standard role permissions.`
    });
  } catch (err) {
    console.error('Error removing individual override:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/drive-proxy
// @desc    Fast stream proxy for Google Drive screenshots with auto-caching
// @access  Public
router.get('/drive-proxy', async (req, res) => {
  try {
    const fileId = req.query.id;
    if (!fileId) return res.status(400).send('Missing file ID');

    const urls = [
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
      `https://drive.google.com/uc?export=view&id=${fileId}`
    ];

    for (const u of urls) {
      try {
        const response = await fetch(u, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.startsWith('image/')) {
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const buffer = await response.arrayBuffer();
          return res.send(Buffer.from(buffer));
        }
      } catch (err) {}
    }

    return res.status(404).send('Image could not be retrieved from Google Drive');
  } catch (err) {
    console.error('Drive proxy error:', err);
    res.status(500).send('Proxy error');
  }
});

// @route   POST /api/admin/send-email
// @desc    Send Registration Confirmation Email or Entry QR Pass Email
// @access  Private (Admin & Staff)
router.post('/send-email', verifyAdminToken, async (req, res) => {
  try {
    const { userId, type } = req.body;
    if (!userId || !type) {
      return res.status(400).json({ message: 'Participant ID and email type (confirmation or qr) are required' });
    }

    if (!['confirmation', 'qr'].includes(type)) {
      return res.status(400).json({ message: 'Invalid email type. Must be "confirmation" or "qr"' });
    }

    // Lookup user by _id or registrationId
    let user = null;
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.findOne({ registrationId: String(userId).trim().toUpperCase() });
    }

    if (!user) {
      return res.status(404).json({ message: 'Participant record not found' });
    }

    if (!user.email) {
      return res.status(400).json({ message: `Participant "${user.name}" has no registered email address` });
    }

    // Fetch registered events with event names and categories
    const registrations = await Registration.find({ registrationId: user.registrationId });
    const events = await Event.find();
    const eventMap = {};
    events.forEach(e => { eventMap[e.eventId] = e; });

    const registeredEvents = registrations.map(reg => {
      const eDoc = eventMap[reg.eventId];
      return {
        name: eDoc?.name || reg.eventId,
        category: eDoc?.category || 'General',
        type: eDoc?.teamAllowed ? 'TEAM' : 'INDIVIDUAL'
      };
    });

    const senderName = req.admin?.name || 'Technika Organizing Committee';

    if (type !== 'confirmation') {
      return res.status(400).json({ message: 'Entry QR Pass email is coming soon. Only registration confirmation email is currently active.' });
    }

    await sendRegistrationConfirmationEmail({
      user,
      events: registeredEvents,
      senderName,
    });

    user.confirmationEmailSent = true;
    user.confirmationEmailSentAt = new Date();
    user.confirmationEmailSentBy = senderName;
    await user.save();

    return res.json({
      success: true,
      message: `Registration confirmation email sent successfully to ${user.email}`,
      user: {
        _id: user._id,
        registrationId: user.registrationId,
        confirmationEmailSent: user.confirmationEmailSent,
        confirmationEmailSentAt: user.confirmationEmailSentAt,
        confirmationEmailSentBy: user.confirmationEmailSentBy,
      }
    });
  } catch (err) {
    console.error('Error in send-email endpoint:', err);
    return res.status(500).json({ message: `Email failed to send: ${err.message}` });
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

    // ── Arka Jain University (Internal) vs Other Institutes (External) ──
    let internalRegistrations = 0;
    instituteAgg.forEach(i => {
      const instName = (i._id || '').toLowerCase();
      if (instName.includes('arka') || instName.includes('jain') || instName === 'aju') {
        internalRegistrations += i.count;
      }
    });
    const externalRegistrations = Math.max(0, totalRegistrations - internalRegistrations);

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

    // ── 7. Event Categories Breakdown (Technical, Cultural, Creative) ──
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

    // ── 9. Source Breakdown (Website, Google Form, Admin Import) ──
    const sourceAgg = await User.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    let websiteCount = 0;
    let googleFormCount = 0;
    let importCount = 0;
    sourceAgg.forEach(s => {
      if (s._id === 'google_form') googleFormCount += s.count;
      else if (s._id === 'admin_import') importCount += s.count;
      else websiteCount += s.count;
    });

    res.json({
      totalRegistrations,
      websiteRegistrations: websiteCount,
      googleFormRegistrations: googleFormCount,
      importRegistrations: importCount,
      internalRegistrations,
      externalRegistrations,
      sourceBreakdown: {
        website: websiteCount,
        googleForm: googleFormCount,
        import: importCount,
      },
      instituteWise,
      totalInstitutes,
      eventWise,
      maxEvent,
      minEvent,
      genderDistribution,
      courseDistribution,
      dailyTrend,
      eventTypeBreakdown,
      totalEventRegistrations
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// @route   GET /api/admin/developer-status
// @desc    Get real-time health, server metrics, pipeline statuses and git commits for developer dashboard
// @access  Public
router.get('/developer-status', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isMongoConnected = mongoose.connection.readyState === 1;

    let dbPing = 18;
    if (isMongoConnected && mongoose.connection.db) {
      try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        dbPing = Date.now() - start;
      } catch (e) {
        dbPing = 25;
      }
    }

    const SheetsQueue = require('../models/SheetsQueue');
    const [userCount, teamCount, regCount, eventCount, cloudinaryUsage, vercelMetrics, queueStats] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Team.countDocuments().catch(() => 0),
      Registration.countDocuments().catch(() => 0),
      Event.countDocuments().catch(() => 0),
      cloudinaryService.getUsage().catch(err => ({ configured: false, error: err.message })),
      vercelService.getVercelMetrics().catch(err => ({ error: err.message })),
      SheetsQueue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).catch(() => [])
    ]);

    const queueMap = { PENDING: 0, FAILED: 0, SUCCESS: 0 };
    (queueStats || []).forEach(q => { if (q && q._id) queueMap[q._id] = q.count; });
    const totalQueueTasks = queueMap.PENDING + queueMap.FAILED + queueMap.SUCCESS;

    let sheetsStatus = 'HEALTHY';
    let sheetsLatency = '1.2s Sync Pacing';
    const bottlenecks = [];
    let healthScore = 100;

    if (!isMongoConnected) {
      healthScore -= 50;
      bottlenecks.push('MongoDB Disconnected');
    }
    if (dbPing > 200) {
      healthScore -= 10;
      bottlenecks.push('High DB Latency');
    }

    if (queueMap.FAILED > 0) {
      sheetsStatus = 'DEGRADED';
      sheetsLatency = `${queueMap.FAILED} failed (retrying)`;
      healthScore -= Math.min(30, queueMap.FAILED * 3);
      bottlenecks.push(`${queueMap.FAILED} Google Sheets sync failures`);
    } else if (queueMap.PENDING > 20) {
      sheetsStatus = 'ACTIVE';
      sheetsLatency = `${queueMap.PENDING} queued (throttled sync)`;
      healthScore -= 10;
      bottlenecks.push(`${queueMap.PENDING} sync tasks backlogged in queue`);
    } else if (queueMap.PENDING > 0) {
      sheetsStatus = 'ACTIVE';
      sheetsLatency = `${queueMap.PENDING} queued | ${queueMap.SUCCESS} synced`;
    } else {
      sheetsStatus = 'HEALTHY';
      sheetsLatency = `${queueMap.SUCCESS} rows synced`;
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    const healthStatusText = healthScore >= 95 ? '100% OPERATIONAL' : (healthScore >= 70 ? `${healthScore}% DEGRADED` : `${healthScore}% CRITICAL`);
    const healthSummaryText = bottlenecks.length === 0 ? 'Zero pipeline bottlenecks detected' : `${bottlenecks.length} bottleneck(s): ${bottlenecks.join(' | ')}`;

    const memory = process.memoryUsage();

    res.json({
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'production',
      nodeVersion: process.version,
      systemHealth: {
        score: healthScore,
        label: healthStatusText,
        summary: healthSummaryText,
        bottlenecks
      },
      sheetsQueue: {
        total: totalQueueTasks,
        pending: queueMap.PENDING,
        failed: queueMap.FAILED,
        success: queueMap.SUCCESS
      },
      cloudinary: cloudinaryUsage,
      vercel: vercelMetrics,
      memory: {
        rssMB: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      database: {
        name: 'MongoDB Atlas',
        status: isMongoConnected ? 'HEALTHY' : 'DEGRADED',
        pingMs: dbPing,
        readyState: mongoose.connection.readyState,
        collections: {
          users: userCount,
          teams: teamCount,
          registrations: regCount,
          events: eventCount
        }
      },
      pipelines: [
        {
          id: 'user-registration',
          name: 'Registration Ingestion Pipeline',
          description: 'Client form submissions -> JWT & Validator -> MongoDB persistence',
          status: isMongoConnected ? 'HEALTHY' : 'WARNING',
          flow: ['Browser Client', 'Express Gateway', 'Auth & Payload Validator', 'MongoDB Cluster'],
          latency: `${dbPing > 0 ? dbPing + 12 : 24}ms`,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'sheets-sync',
          name: 'Google Sheets Data Lake Sync',
          description: `Asynchronous event queue worker streaming rows to Google Spreadsheets (${queueMap.SUCCESS} Synced, ${queueMap.PENDING} Pending, ${queueMap.FAILED} Failed)`,
          status: sheetsStatus,
          flow: ['Registration Event Hook', 'Async Memory Queue Worker', 'Google Sheets v4 API', 'Cloud Spreadsheet'],
          latency: sheetsLatency,
          configured: Boolean(process.env.GOOGLE_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
        },
        {
          id: 'media-cloudinary',
          name: 'Payment & Media CDN Pipeline',
          description: 'Payment transaction screenshot uploads, compression and secure CDN distribution',
          status: process.env.CLOUDINARY_CLOUD_NAME ? 'HEALTHY' : 'READY',
          flow: ['Multer Stream', 'Image Buffer', 'Cloudinary CDN', 'HTTPS Asset URL'],
          latency: '450ms avg upload',
          configured: Boolean(process.env.CLOUDINARY_CLOUD_NAME)
        },
        {
          id: 'live-analytics',
          name: 'Live Telemetry Aggregation Feed',
          description: 'High-speed aggregation pipeline feeding the standalone dashboard in real time',
          status: 'HEALTHY',
          flow: ['MongoDB Aggregation Engine', 'Express /api/admin/analytics', 'CORS Bridge', 'React Analytics Client'],
          latency: `${dbPing > 0 ? dbPing + 5 : 18}ms`
        }
      ],
      servers: [
        {
          id: 'main-website',
          name: 'Main Festival Website',
          repo: 'adeebrazi/technika2026-main-website',
          githubUrl: 'https://github.com/adeebrazi/technika2026-main-website',
          url: 'https://technika2026.online',
          role: 'Public Event Portal & Brochure',
          hosting: 'Vercel Edge Network',
          branch: 'main',
          lastCommit: {
            hash: '727447a',
            message: 'chore: remove Dashboard subfolder as it is now in a standalone repository',
            date: 'Sun Oct 4 20:01:40 2026 +0530',
            author: 'adeebrazi'
          }
        },
        {
          id: 'registration-api',
          name: 'Registration & Core API Server',
          repo: 'adeebrazi/technika2026-registration-website',
          githubUrl: 'https://github.com/adeebrazi/technika2026-registration-website',
          url: 'https://reg.technika2026.online',
          role: 'Backend API, Auth & Data Pipelines',
          hosting: 'Vercel Serverless / Node.js',
          branch: 'main',
          lastCommit: {
            hash: 'e3ad02c',
            message: 'Disconnect admin dashboard from registration and move files to future plan',
            date: 'Sun Oct 4 21:43:56 2026 +0530',
            author: 'adeebrazi'
          }
        },
        {
          id: 'dashboard-app',
          name: 'Standalone Analytics Dashboard',
          repo: 'adeebrazi/technika2026-dashboard',
          githubUrl: 'https://github.com/adeebrazi/technika2026-dashboard',
          url: 'https://dashboard.technika2026.online',
          role: 'Executive & Developer Dashboards',
          hosting: 'Vercel Production SPA',
          branch: 'main',
          lastCommit: {
            hash: '8573cd8',
            message: 'Remove tab strip, add Event Categories and Age Demographics analytics',
            date: 'Sun Oct 4 20:41:28 2026 +0530',
            author: 'adeebrazi'
          }
        }
      ]
    });
  } catch (err) {
    console.error('Developer status error:', err);
    res.status(500).json({ message: 'Error retrieving developer status', error: err.message });
  }
});

module.exports = router;

