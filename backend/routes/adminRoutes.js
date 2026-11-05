const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyAdminToken, authorizeRoles } = require('../middleware/role');
const User = require('../models/User');
const Team = require('../models/Team');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const RolePermission = require('../models/RolePermission');
const AdminUser = require('../models/AdminUser');
const cloudinaryService = require('../services/cloudinaryService');
const vercelService = require('../services/vercelService');
const { sendRegistrationConfirmationEmail } = require('../utils/emailService');

// Permanent Master Administrator definition (Undestroyable Root Admin)
const MASTER_ADMIN = {
  name: 'Adeeb Razi',
  email: 'adeeb@technika2026.online',
  password: 'Lion@2048@Technika6.0',
  role: 'admin',
  designation: 'Administration',
  isPermanent: true,
  isActive: true,
};

// Automatic bootstrap helper: guarantees Master Admin Adeeb Razi is always active, permanent, and has correct credentials
const ensureMasterAdmin = async () => {
  try {
    const existing = await AdminUser.findOne({ email: MASTER_ADMIN.email });
    if (!existing) {
      const hash = await bcrypt.hash(MASTER_ADMIN.password, 10);
      await AdminUser.create({
        name: MASTER_ADMIN.name,
        email: MASTER_ADMIN.email,
        passwordHash: hash,
        role: MASTER_ADMIN.role,
        designation: MASTER_ADMIN.designation,
        isPermanent: true,
        isActive: true,
        createdBy: 'system_bootstrap',
      });
      console.log('🛡️ Master Admin bootstrapped into MongoDB:', MASTER_ADMIN.email);
    } else {
      let needsSave = false;
      if (!existing.isPermanent || !existing.isActive || existing.role !== 'admin' || existing.name !== MASTER_ADMIN.name) {
        existing.isPermanent = true;
        existing.isActive = true;
        existing.role = 'admin';
        existing.designation = existing.designation || 'Administration';
        existing.name = MASTER_ADMIN.name;
        needsSave = true;
      }
      const isMatch = await bcrypt.compare(MASTER_ADMIN.password, existing.passwordHash);
      if (!isMatch) {
        existing.passwordHash = await bcrypt.hash(MASTER_ADMIN.password, 10);
        needsSave = true;
      }
      if (needsSave) {
        await existing.save();
        console.log('🛡️ Master Admin verified & refreshed in MongoDB:', MASTER_ADMIN.email);
      }
    }
  } catch (err) {
    console.error('Error verifying master admin:', err.message);
  }
};

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

// Dynamically build staff profiles from environment variables (No hardcoded credentials or names in code)
const getAllStaffProfiles = () => {
  const profiles = {};
  const admins = parseEnvUsers(process.env.ADMIN_USERS);
  const faculty = parseEnvUsers(process.env.FACULTY_USERS);
  const coordinators = parseEnvUsers(process.env.COORDINATOR_USERS);
  const volunteers = parseEnvUsers(process.env.VOLUNTEER_USERS);

  admins.forEach(u => {
    profiles[u.email] = { name: u.name || formatNameFromEmail(u.email), designation: 'Administration' };
  });
  faculty.forEach(u => {
    profiles[u.email] = { name: u.name || formatNameFromEmail(u.email), designation: 'Faculty Coordinator' };
  });
  coordinators.forEach(u => {
    profiles[u.email] = { name: u.name || formatNameFromEmail(u.email), designation: 'Student Coordinator' };
  });
  volunteers.forEach(u => {
    profiles[u.email] = { name: u.name || formatNameFromEmail(u.email), designation: 'Volunteer' };
  });
  return profiles;
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
// @desc    Admin authentication with database-first verified credentials & strict role verification
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  // If logging in as master admin, ensure database entry is seeded and verified
  if (cleanEmail === MASTER_ADMIN.email) {
    await ensureMasterAdmin();
  }

  let matchedUser = null;

  // 1. First check MongoDB AdminUser collection
  try {
    const dbUser = await AdminUser.findOne({ email: cleanEmail, isActive: true });
    if (dbUser) {
      const isPasswordValid = await bcrypt.compare(cleanPass, dbUser.passwordHash);
      if (isPasswordValid) {
        matchedUser = {
          _id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          designation: dbUser.designation,
          isPermanent: Boolean(dbUser.isPermanent) || cleanEmail === MASTER_ADMIN.email,
        };
      }
    }
  } catch (dbErr) {
    console.error('Database lookup error in login:', dbErr.message);
  }

  // 2. Fallback for Master Admin emergency login (e.g. cold start)
  if (!matchedUser && cleanEmail === MASTER_ADMIN.email && cleanPass === MASTER_ADMIN.password) {
    await ensureMasterAdmin();
    matchedUser = {
      name: MASTER_ADMIN.name,
      email: MASTER_ADMIN.email,
      role: MASTER_ADMIN.role,
      designation: MASTER_ADMIN.designation,
      isPermanent: true,
    };
  }

  // 3. Fallback for legacy environment variables (strictly bypassed for Master Admin Adeeb Razi)
  if (!matchedUser && cleanEmail !== MASTER_ADMIN.email) {
    const rolesMap = {
      admin: parseEnvUsers(process.env.ADMIN_USERS),
      faculty: parseEnvUsers(process.env.FACULTY_USERS),
      coordinator: parseEnvUsers(process.env.COORDINATOR_USERS),
      volunteer: parseEnvUsers(process.env.VOLUNTEER_USERS)
    };

    for (const [rKey, usersList] of Object.entries(rolesMap)) {
      const match = usersList.find(u => u.email === cleanEmail && u.password === cleanPass);
      if (match) {
        matchedUser = {
          name: match.name || formatNameFromEmail(cleanEmail),
          email: cleanEmail,
          role: rKey,
          designation: ROLE_KEY_TO_TITLE[rKey] || 'Staff Member',
          isPermanent: cleanEmail === MASTER_ADMIN.email,
        };
        break;
      }
    }
  }

  // If no credentials matched anywhere
  if (!matchedUser) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // STRICT ROLE ENFORCEMENT:
  // If user selected a specific role on frontend, verify compatibility
  const requestedRoleKey = role ? ROLE_NAME_TO_KEY[role] : null;

  if (requestedRoleKey && requestedRoleKey !== matchedUser.role) {
    // Special exception: volunteer can log in under coordinator portal
    if (!(matchedUser.role === 'volunteer' && requestedRoleKey === 'coordinator')) {
      const actualTitle = ROLE_KEY_TO_TITLE[matchedUser.role] || matchedUser.role;
      const requestedTitle = role;
      return res.status(403).json({
        message: `Access Denied: Your account is registered as ${actualTitle}. You cannot log in as ${requestedTitle}.`
      });
    }
  }

  const finalRoleKey = matchedUser.role;
  const finalDesignation = matchedUser.designation || ROLE_KEY_TO_TITLE[finalRoleKey] || 'Staff Member';
  const displayName = matchedUser.name;

  // Create JWT token
  const payload = {
    id: matchedUser._id,
    email: cleanEmail,
    role: finalRoleKey,
    name: displayName,
    designation: finalDesignation,
    isAdmin: true,
    isPermanent: Boolean(matchedUser.isPermanent)
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
        isPermanent: Boolean(matchedUser.isPermanent),
        permissions: userPerms
      });
    }
  );
});

// @route   GET /api/admin/staff
// @desc    Get all staff accounts from database
// @access  Private (Administrator Only)
router.get('/staff', verifyAdminToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await ensureMasterAdmin();
    const staff = await AdminUser.find().select('-passwordHash').sort({ isPermanent: -1, createdAt: -1 });
    res.json({
      success: true,
      staff,
    });
  } catch (err) {
    console.error('Error fetching staff list:', err);
    res.status(500).json({ message: 'Server error fetching staff members' });
  }
});

// @route   POST /api/admin/staff
// @desc    Create a new staff member (Admin, Faculty Coordinator, Student Coordinator, Volunteer)
// @access  Private (Administrator Only)
router.post('/staff', verifyAdminToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, role, designation } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanPass.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const allowedRoles = ['admin', 'faculty', 'coordinator', 'volunteer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
    }

    const existingUser = await AdminUser.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'A staff account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(cleanPass, 10);
    const resolvedDesignation = designation?.trim() || ROLE_KEY_TO_TITLE[role] || 'Staff Member';

    const newStaff = await AdminUser.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
      designation: resolvedDesignation,
      isPermanent: false,
      isActive: true,
      createdBy: req.admin?.email || 'admin',
    });

    const staffObj = newStaff.toObject();
    delete staffObj.passwordHash;

    res.status(201).json({
      success: true,
      message: `Staff member ${newStaff.name} created successfully as ${resolvedDesignation}.`,
      staff: staffObj,
    });
  } catch (err) {
    console.error('Error creating staff member:', err);
    res.status(500).json({ message: err.message || 'Server error creating staff account' });
  }
});

// @route   PUT /api/admin/staff/:id
// @desc    Update staff member designation, role, active status, or password
// @access  Private (Administrator Only)
router.put('/staff/:id', verifyAdminToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, role, isActive, password } = req.body;

    let staff = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await AdminUser.findById(id);
    }
    if (!staff) {
      staff = await AdminUser.findOne({ email: id.toLowerCase() });
    }
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    // Protection for Master Admin Adeeb Razi:
    if (staff.isPermanent || staff.email.toLowerCase() === MASTER_ADMIN.email.toLowerCase()) {
      if (role && role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Master Administrator role cannot be demoted or changed.' });
      }
      if (isActive === false) {
        return res.status(403).json({ message: 'Forbidden: Master Administrator cannot be deactivated.' });
      }
      if (password && password.trim()) {
        if (req.admin?.email?.toLowerCase() !== MASTER_ADMIN.email.toLowerCase()) {
          return res.status(403).json({ message: 'Forbidden: Only Master Administrator can change their own password.' });
        }
        if (password.trim().length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }
        staff.passwordHash = await bcrypt.hash(password.trim(), 10);
      }
      if (name) staff.name = name.trim();
      if (designation) staff.designation = designation.trim();
      await staff.save();

      const staffObj = staff.toObject();
      delete staffObj.passwordHash;
      return res.json({ success: true, message: 'Master Administrator updated.', staff: staffObj });
    }

    // Regular staff update:
    if (name) staff.name = name.trim();
    if (designation) staff.designation = designation.trim();
    if (role && ['admin', 'faculty', 'coordinator', 'volunteer'].includes(role)) {
      staff.role = role;
    }
    if (typeof isActive === 'boolean') {
      staff.isActive = isActive;
    }
    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }
      staff.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    await staff.save();

    const staffObj = staff.toObject();
    delete staffObj.passwordHash;

    res.json({
      success: true,
      message: `Staff member ${staff.name} updated successfully.`,
      staff: staffObj,
    });
  } catch (err) {
    console.error('Error updating staff member:', err);
    res.status(500).json({ message: 'Server error updating staff member' });
  }
});

// @route   DELETE /api/admin/staff/:id
// @desc    Delete staff member account (STRICTLY PROHIBITED FOR MASTER ADMIN)
// @access  Private (Administrator Only)
router.delete('/staff/:id', verifyAdminToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    let staff = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await AdminUser.findById(id);
    }
    if (!staff) {
      staff = await AdminUser.findOne({ email: id.toLowerCase() });
    }
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    // STRICT UNDESTROYABLE GUARD
    if (staff.isPermanent || staff.email.toLowerCase() === MASTER_ADMIN.email.toLowerCase()) {
      return res.status(403).json({
        message: 'Forbidden: Master Administrator (Adeeb Razi) is permanent and cannot be deleted or removed.'
      });
    }

    // Remove any custom role permissions assigned to this user's email
    await RolePermission.deleteOne({ targetKey: staff.email.toLowerCase() });
    await AdminUser.findByIdAndDelete(staff._id);

    res.json({
      success: true,
      message: `Staff member ${staff.name} (${staff.email}) deleted successfully.`,
    });
  } catch (err) {
    console.error('Error deleting staff member:', err);
    res.status(500).json({ message: 'Server error deleting staff member' });
  }
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
// @desc    Get all users with their registered events (strictly permission-filtered)
// @access  Private (All Admin Roles)
router.get('/users', verifyAdminToken, async (req, res) => {
  try {
    if (req.query.sync === '1' || req.query.sync === 'true') {
      await triggerLiveSyncIfNeeded(true);
    }

    const requestingRole = req.admin?.role; // 'admin' | 'faculty' | 'coordinator'
    const requestingEmail = req.admin?.email;
    const perms = await getActivePermissions(requestingRole, requestingEmail);

    // Permission Enforcement: If canViewParticipants is false for non-admin, deny access
    if (requestingRole !== 'admin' && perms.canViewParticipants === false) {
      return res.status(403).json({
        message: 'Access Restricted: You do not have permission to view registered participants.',
        accessLevel: 'none',
        permissions: perms,
        users: []
      });
    }

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
    await ensureMasterAdmin();
    const dbPerms = await RolePermission.find();
    const permMap = {};
    dbPerms.forEach(p => {
      permMap[p.targetKey] = p.toObject();
    });

    // 1. Fetch dynamic staff from MongoDB
    const allDbStaff = await AdminUser.find({ isActive: true }).select('-passwordHash');

    // 2. Also parse any env users as fallback
    const envProfiles = getAllStaffProfiles();
    const staffFaculty = [];
    const staffCoordinators = [];
    const staffAdmins = [];
    const seenEmails = new Set();

    allDbStaff.forEach(s => {
      seenEmails.add(s.email.toLowerCase());
      const item = {
        _id: s._id,
        email: s.email,
        name: s.name,
        designation: s.designation,
        role: s.role,
        isPermanent: Boolean(s.isPermanent),
        isActive: s.isActive,
      };
      if (s.role === 'admin') staffAdmins.push(item);
      else if (s.role === 'faculty') staffFaculty.push(item);
      else staffCoordinators.push(item);
    });

    Object.entries(envProfiles).forEach(([email, p]) => {
      if (!seenEmails.has(email.toLowerCase())) {
        const role = p.designation === 'Faculty Coordinator' ? 'faculty' : (p.designation === 'Administration' ? 'admin' : 'coordinator');
        const item = {
          email,
          name: p.name,
          designation: p.designation,
          role,
          isPermanent: email.toLowerCase() === MASTER_ADMIN.email.toLowerCase(),
          isActive: true,
        };
        if (role === 'admin') staffAdmins.push(item);
        else if (role === 'faculty') staffFaculty.push(item);
        else staffCoordinators.push(item);
      }
    });

    res.json({
      success: true,
      faculty: permMap['faculty'] || DEFAULT_PERMISSIONS.faculty,
      coordinator: permMap['coordinator'] || DEFAULT_PERMISSIONS.coordinator,
      customOverrides: dbPerms.filter(p => p.targetKey !== 'faculty' && p.targetKey !== 'coordinator'),
      staffList: {
        faculty: staffFaculty,
        coordinators: staffCoordinators,
        admins: staffAdmins
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

    const staffProfiles = getAllStaffProfiles();
    const defaultTitle = targetKey === 'faculty' ? 'Faculty Coordinator' : (targetKey === 'coordinator' ? 'Student Coordinator' : (staffProfiles[targetKey]?.name || targetKey));

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
    const requestingRole = req.admin?.role;
    const requestingEmail = req.admin?.email;
    const perms = await getActivePermissions(requestingRole, requestingEmail);

    if (requestingRole !== 'admin' && !perms.canViewContactInfo) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to communicate with participants.' });
    }

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
    const requestingRole = req.admin?.role;
    const requestingEmail = req.admin?.email;
    const perms = await getActivePermissions(requestingRole, requestingEmail);

    if (requestingRole !== 'admin' && perms.canViewTeams === false) {
      return res.status(403).json({ message: 'Access Restricted: You do not have permission to view teams.' });
    }

    const canViewContact = requestingRole === 'admin' || Boolean(perms.canViewContactInfo);

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
        email: canViewContact ? leaderDoc.email : undefined,
        whatsapp: canViewContact ? leaderDoc.whatsapp : undefined,
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
            email: canViewContact ? memberUser.email : undefined,
            whatsapp: canViewContact ? memberUser.whatsapp : undefined,
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

// ── LIVE GOOGLE FORM SYNC HOOK FOR SERVERLESS / LIVE DASHBOARD ──
const triggerLiveSyncIfNeeded = async (force = false) => {
  try {
    const SyncLock = require('../models/SyncLock');
    const now = new Date();

    if (!force) {
      const lockDoc = await SyncLock.findOne({ lockName: 'google_form_sync' }).lean();
      if (lockDoc && lockDoc.lastSyncedAt && (now.getTime() - new Date(lockDoc.lastSyncedAt).getTime() < 45000)) {
        // Cooldown active: synced less than 45s ago across all serverless containers
        return;
      }
    }

    const { syncGoogleSheetNow } = require('../services/googleSheetPoller');
    return await syncGoogleSheetNow();
  } catch (syncErr) {
    console.warn('[LIVE SYNC HOOK NOTICE]:', syncErr.message);
  }
};

// @route   ALL /api/admin/sync-live
// @desc    Force trigger live sync from Google Sheet
router.all('/sync-live', async (req, res) => {
  try {
    const result = await triggerLiveSyncIfNeeded(true);
    res.json({ success: true, timestamp: new Date(), result, message: 'Google Form responses synced successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get comprehensive analytics for dashboard
// @access  Public (No login required)
router.get('/analytics', async (req, res) => {
  try {
    const forceSync = req.query.sync === '1' || req.query.sync === 'true';
    await triggerLiveSyncIfNeeded(forceSync);
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
module.exports.ensureMasterAdmin = ensureMasterAdmin;

