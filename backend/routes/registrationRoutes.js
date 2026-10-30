const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Notification = require('../models/Notification');
const cloudinaryService = require('../services/cloudinaryService');
const { compressImage } = require('../utils/imageCompressor');
const { queueParticipantSync, queueRegistrationSync, appendVerificationRecord } = require('../services/sheetsService');

// Multer configuration for file upload in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit before compression
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed!'), false);
    }
  }
});

// Helper: Generate unique random 6-character registration ID
const generateRegistrationId = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let unique = false;
  let regId = '';
  while (!unique) {
    regId = '';
    for (let i = 0; i < 6; i++) {
      regId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const existing = await User.findOne({ registrationId: regId });
    if (!existing) unique = true;
  }
  return regId;
};

// Helper: Generate unique Team ID (e.g., T10492)
const generateTeamId = async () => {
  let unique = false;
  let teamId = '';
  while (!unique) {
    const rand = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    teamId = `T${rand}`;
    const existing = await Team.findOne({ teamId });
    if (!existing) unique = true;
  }
  return teamId;
};

const { EVENT_ID_MAP } = require('../utils/eventConstants');


// Helper: Upload file buffer to Cloudinary with local disk fallback
const saveUploadedImage = async (buffer, customFileName, customFolder, localSubdir = 'general') => {
  let fileUrl = '';
  let uploadedToCloudinary = false;
  if (cloudinaryService.isConfigured) {
    try {
      fileUrl = await cloudinaryService.uploadToCloudinary(buffer, customFileName, customFolder);
      uploadedToCloudinary = true;
      console.log(`[CLOUDINARY] Uploaded ${customFileName} to folder: ${customFolder}`);
    } catch (err) {
      console.warn(`[CLOUDINARY UPLOAD FAILED for ${customFolder}] falling back to local storage: ${err.message}`);
    }
  }

  if (!uploadedToCloudinary) {
    try {
      if (process.env.VERCEL) {
        console.warn('[VERCEL WARNING] Uploading to local folder in Vercel serverless context. This file will NOT persist!');
      }
      const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', localSubdir);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localPath = path.join(uploadsDir, customFileName);
      fs.writeFileSync(localPath, buffer);
      fileUrl = `/uploads/${localSubdir}/${customFileName}`;
      console.log(`Saved locally at: ${fileUrl}`);
    } catch (writeError) {
      console.error('[WRITE ERROR] Failed to write local file:', writeError.message);
      fileUrl = `/uploads/${localSubdir}/failed_${customFileName}`;
    }
  }
  return fileUrl;
};

// @route   POST /api/register
// @desc    Register a participant, upload screenshot, generate ID, and download receipt (no events)
// @access  Public
router.post(
  '/',
  upload.fields([
    { name: 'paymentScreenshot', maxCount: 1 },
    { name: 'noDuesSlip', maxCount: 1 },
    { name: 'collegeIdCard', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        name,
        age,
        dob,
        gender,
        email,
        whatsapp,
        institution,
        course,
        semester,
        password,
        paymentUTR
      } = req.body;

      // 1. Basic Account & Identity Validations
      if (!email || !email.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'A valid Gmail address is required!' });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long!' });
      }

      // Multiple students are allowed to register with the same email ID.
      // Only block if the exact same participant (same name & email) is already registered.
      const existingSameStudent = await User.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        email: email.toLowerCase().trim()
      });
      if (existingSameStudent) {
        return res.status(400).json({
          message: `Participant "${name}" is already registered with ID: ${existingSameStudent.registrationId}. If you are registering another student with this email, please enter their own name.`
        });
      }

      // 2. Parse selected events
      let parsedEventsInput = [];
      if (req.body.selectedEvents) {
        try {
          parsedEventsInput = JSON.parse(req.body.selectedEvents);
        } catch (e) {
          console.warn('Failed to parse selectedEvents:', e.message);
        }
      }

      // Normalize to array of event slugs
      const normalizedEvents = [];
      for (const item of parsedEventsInput) {
        if (typeof item === 'string') {
          normalizedEvents.push({ slug: item });
        } else if (item && typeof item === 'object' && item.slug) {
          normalizedEvents.push({ slug: item.slug });
        }
      }

      if (normalizedEvents.length === 0) {
        return res.status(400).json({ message: 'You must select at least one event to register!' });
      }

      // 3. Institution & Course Rule Checks
      const isArkaJain = (institution || '').toLowerCase().includes('arka jain');
      const courseLower = (course || '').toLowerCase();
      const isExemptCourse =
        courseLower.includes('b.tech') ||
        courseLower.includes('btech') ||
        courseLower.includes('b.e.') ||
        courseLower.includes('bca') ||
        courseLower.includes('diploma') ||
        courseLower.includes('polytechnic');
      const isAjuExempt = isArkaJain && isExemptCourse;

      // RULE: Treasure Hunt is disabled for ARKA JAIN University students
      if (isArkaJain) {
        for (const item of normalizedEvents) {
          if (item.slug === 'treasure-hunt' || item.slug === 'CUL_TH') {
            return res.status(400).json({
              message: 'Treasure Hunt is exclusively for outside colleges and is not permitted for ARKA JAIN University students.'
            });
          }
        }
      }

      // 6. Generate Unique Registration ID
      const registrationId = await generateRegistrationId();

      // 7. Hash Password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 8. Payment & Document Verification
      let cleanUTR = '';
      let finalAiUtr = '';
      let paymentScreenshotUrl = '';
      let noDuesSlipUrl = null;
      let collegeIdCardUrl = null;
      let expectedAmount = 0;
      let verifiedAmount = 0;
      let verificationStatus = 'PENDING';

      if (isAjuExempt) {
        // --- ARKA JAIN UNIVERSITY (B.Tech / BCA / Diploma) EXEMPTION FLOW ---
        const noDuesSlipFile = req.files && req.files['noDuesSlip'] ? req.files['noDuesSlip'][0] : null;
        const collegeIdCardFile = req.files && req.files['collegeIdCard'] ? req.files['collegeIdCard'][0] : null;

        if (!noDuesSlipFile) {
          return res.status(400).json({
            message: 'Please upload your ₹600 manual payment slip paid during No-Dues!'
          });
        }
        if (!collegeIdCardFile) {
          return res.status(400).json({
            message: 'Please upload your College ID Card for student verification!'
          });
        }

        // Compress and upload both documents
        const compressedSlip = await compressImage(noDuesSlipFile.buffer);
        const compressedId = await compressImage(collegeIdCardFile.buffer);

        const slipFileName = `nodues_${Date.now()}_${registrationId}.jpg`;
        const idFileName = `collegeid_${Date.now()}_${registrationId}.jpg`;

        noDuesSlipUrl = await saveUploadedImage(
          compressedSlip,
          slipFileName,
          'technika-no-dues-slips',
          'no_dues_slips'
        );
        collegeIdCardUrl = await saveUploadedImage(
          compressedId,
          idFileName,
          'technika-college-ids',
          'college_ids'
        );

        // Auto-generate non-colliding UTR references for DB uniqueness constraints
        cleanUTR = `NODUES-${registrationId}`;
        finalAiUtr = `NODUES-${registrationId}`;
        paymentScreenshotUrl = noDuesSlipUrl;
        expectedAmount = 600;
        verifiedAmount = 600;
        verificationStatus = 'SUCCESS';
      } else {
        // --- STANDARD ONLINE UPI PAYMENT (₹100) FLOW ---
        const paymentFile = req.files && req.files['paymentScreenshot'] ? req.files['paymentScreenshot'][0] : null;
        if (!paymentFile) {
          return res.status(400).json({ message: 'Payment screenshot is required!' });
        }

        cleanUTR = (paymentUTR || '').toString().trim();
        if (!cleanUTR) {
          return res.status(400).json({ message: 'Payment UTR / Reference number is required!' });
        }

        if (!/^\d{12}$/.test(cleanUTR)) {
          return res.status(400).json({ message: 'Payment UTR Number must be exactly 12 numeric digits!' });
        }

        const existingUTR = await User.findOne({ paymentUTR: cleanUTR });
        if (existingUTR) {
          return res.status(400).json({ message: 'This Payment UTR (12-digit Ref No.) has already been used for registration!' });
        }

        const existingManualUTR = await User.findOne({ utrEnteredManually: cleanUTR });
        if (existingManualUTR) {
          return res.status(400).json({ message: 'This manually entered 12-digit UTR/Ref No. has already been used!' });
        }

        // Compress image and upload to Cloudinary or disk
        const compressedBuffer = await compressImage(paymentFile.buffer);
        const fileName = `${Date.now()}_${registrationId}.jpg`;
        paymentScreenshotUrl = await saveUploadedImage(
          compressedBuffer,
          fileName,
          'technika-payment-screenshots',
          'payment_screenshots'
        );

        expectedAmount = 100;
        verifiedAmount = 100;
        finalAiUtr = cleanUTR;
        verificationStatus = 'SUCCESS';
      }

      // 9. Save Participant details in User collection
      const user = new User({
        registrationId,
        name,
        gender: gender || 'Not Specified',
        email,
        whatsapp,
        institution,
        course,
        semester,
        passwordHash,
        paymentUTR: cleanUTR,
        utrEnteredManually: cleanUTR,
        utrFetchedFromScreenshot: finalAiUtr,
        paymentScreenshotUrl,
        expectedAmount,
        verifiedAmount,
        verificationStatus,
        isAjuExempt,
        noDuesSlipUrl,
        collegeIdCardUrl
      });
      await user.save();

    const createdTeams = [];

    // All events are registered individually - teams are formed on-spot at the venue
    if (normalizedEvents && normalizedEvents.length > 0) {
      for (const item of normalizedEvents) {
        const eventId = EVENT_ID_MAP[item.slug] || item.slug;
        if (!eventId) continue;

        try {
          const event = await Event.findOne({ eventId, isActive: true });
          if (!event) continue;

          const reg = new Registration({
            registrationId,
            eventId,
            teamId: null,
            registrationType: 'INDIVIDUAL',
            status: 'CONFIRMED'
          });
          await reg.save();
          queueRegistrationSync(reg, event).catch(err => console.error('[SHEETS INITIAL REG SYNC ERROR]', err.message));
        } catch (eventErr) {
          console.error(`Failed to register event ${eventId} on signup:`, eventErr.message);
        }
      }
    }

    // Sync Google Sheets Audit Log (in background)
    appendVerificationRecord({
      name,
      email,
      selectedEvents: normalizedEvents.map(e => e.slug),
      expectedAmount,
      verifiedAmount,
      utrEnteredManually: cleanUTR,
      utrFetchedFromScreenshot: finalAiUtr,
      screenshotUrl: paymentScreenshotUrl,
      status: verificationStatus
    }).catch(err => console.error('[SHEETS AUDIT ERROR]', err.message));

    // Sync Google Sheets Synchronization (in background)
    queueParticipantSync(user).catch(err => console.error('[SHEETS BACKGROUND ERROR] Failed to sync participant:', err.message));

    // 8. Send Response
    res.json({
      success: true,
      registrationId,
      name: user.name,
      createdTeams
    });
  } catch (error) {
    console.error('Registration processing error:', error);
    res.status(500).json({ message: 'An internal server error occurred during registration.' });
  }
});

module.exports = router;
