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
const cloudinaryService = require('../services/cloudinaryService');
const { compressImage } = require('../utils/imageCompressor');
const { queueParticipantSync, queueRegistrationSync, appendVerificationRecord } = require('../services/sheetsService');
const { verifyPaymentScreenshot } = require('../utils/geminiVerifier');

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

const EVENT_ID_MAP = {
  "code-busters": "TECH_CB",
  "red-tech": "TECH_RT",
  "robo-wars": "TECH_RW",
  "robo-race": "TECH_RR",
  "robo-pick-n-place": "TECH_RP",
  "intelliquest": "TECH_IQ",
  "brainstorm-battle": "TECH_BS",
  "circuit-crafter": "TECH_CC",
  "electrofix-challenge": "TECH_EC",
  "junkyard-wars": "TECH_JW",
  "ai-quizathon": "TECH_AQ",
  "ecoai-challenge": "TECH_EA",
  "project-model-exhibition": "TECH_PM",
  "coding-ladder": "TECH_CL",
  "web-wizard": "TECH_WW",
  "cyber-shield": "TECH_CS",
  "app-attack": "TECH_AA",
  "data-dash": "TECH_DD",
  "design-dash": "TECH_DS",
  "load-bridging": "TECH_LB",
  "poster-presentation": "CRE_PP",
  "face-painting": "CRE_FP",
  "pot-painting": "CRE_PT",
  "photography": "CRE_PH",
  "greenearth-challenge": "CRE_GE",
  "cricket": "CRE_CR",
  "need-for-speed": "CRE_NF",
  "bgmi": "CRE_BG",
  "free-fire": "CRE_FF",
  "technical-debate": "CRE_TD",
  "group-ramp-walk": "CUL_GW",
  "solo-ramp-walk": "CUL_SW",
  "treasure-hunt": "CUL_TH",
  "tug-of-war": "CUL_TW",
  "sudoku": "CUL_SD",
  "fire-free-cooking": "CUL_FC",
  "solo-singing": "CUL_SS",
  "solo-dance": "CUL_SDN",
  "group-singing": "CUL_GS",
  "group-dance": "CUL_GD",
  "rap": "CUL_RP",
  "beat-boxing": "CUL_BB",
  "poetry": "CUL_PT",
  "story-telling": "CUL_ST",
  "art-attack": "CUL_AA"
};


// @route   POST /api/register
// @desc    Register a participant, upload screenshot, generate ID, and download receipt (no events)
// @access  Public
router.post('/', upload.single('paymentScreenshot'), async (req, res) => {
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

    // 1. Validations
    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required!' });
    }

    if (!email || !email.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'A valid Gmail address is required!' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long!' });
    }

    if (!paymentUTR) {
      return res.status(400).json({ message: 'Payment UTR is required!' });
    }

    // Check unique UTR
    const existingUTR = await User.findOne({ paymentUTR });
    if (existingUTR) {
      return res.status(400).json({ message: 'This Payment UTR has already been used for registration!' });
    }

    // Check unique email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'This email is already registered!' });
    }

    // 2. Generate Unique Registration ID
    const registrationId = await generateRegistrationId();

    // 3. Image Compression
    const compressedBuffer = await compressImage(req.file.buffer);

    // 4. Upload to Cloudinary with local fallback on error
    let paymentScreenshotUrl = '';
    const fileName = `${Date.now()}_${registrationId}.jpg`;
    
    let uploadedToCloudinary = false;
    if (cloudinaryService.isConfigured) {
      try {
        paymentScreenshotUrl = await cloudinaryService.uploadToCloudinary(compressedBuffer, fileName);
        uploadedToCloudinary = true;
        console.log('Payment screenshot successfully uploaded to Cloudinary.');
      } catch (err) {
        console.warn(`[CLOUDINARY UPLOAD FAILED] falling back to local storage: ${err.message}`);
      }
    }

    // Local Fallback: If not uploaded to Cloudinary, save locally in public/uploads/
    if (!uploadedToCloudinary) {
      try {
        if (process.env.VERCEL) {
          console.warn('[VERCEL WARNING] Uploading screenshot to local folder in Vercel serverless context. This file will NOT persist!');
        }
        const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const localPath = path.join(uploadsDir, fileName);
        fs.writeFileSync(localPath, compressedBuffer);
        
        // Set the path served by Express static
        paymentScreenshotUrl = `/uploads/${fileName}`;
        console.log(`Payment screenshot saved locally at: ${paymentScreenshotUrl}`);
      } catch (writeError) {
        console.error('[WRITE ERROR] Failed to write local screenshot file:', writeError.message);
        // Fallback to a placeholder URL so registration doesn't fail
        paymentScreenshotUrl = `/uploads/failed_local_write_${fileName}`;
        if (process.env.VERCEL) {
          console.warn('[VERCEL ERROR] Local write failed due to read-only filesystem. Configured CLOUDINARY credentials are highly recommended!');
        }
      }
    }

    // 5. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Save Participant details in User collection
    let finalAge = parseInt(age);
    if (isNaN(finalAge) && dob) {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let computedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          computedAge--;
        }
        finalAge = computedAge;
      }
    }

    if (isNaN(finalAge) || finalAge < 0) {
      return res.status(400).json({ message: 'A valid Date of Birth or Age is required!' });
    }

    // Parse selected events first to calculate expectedAmount
    let selectedEvents = [];
    if (req.body.selectedEvents) {
      try {
        selectedEvents = JSON.parse(req.body.selectedEvents);
      } catch (e) {
        console.warn('Failed to parse selectedEvents:', e.message);
      }
    }

    // Calculate expected payment amount
    let expectedAmount = 0;
    const normalEventsSelected = selectedEvents.filter(
      (id) => id !== 'paint-ball' && id !== 'night-show'
    );
    if (normalEventsSelected.length > 0) {
      expectedAmount += 150;
    }
    if (selectedEvents.includes('paint-ball')) {
      expectedAmount += 350;
    }
    if (selectedEvents.includes('night-show')) {
      expectedAmount += 650;
    }

    if (expectedAmount === 0) {
      return res.status(400).json({ message: 'You must select at least one event to register!' });
    }

    // AI Screenshot Verification Pipeline
    const aiResult = await verifyPaymentScreenshot(paymentScreenshotUrl);

    if (aiResult.status !== 'SUCCESS') {
      return res.status(400).json({ message: 'Payment verification failed: The screenshot is not a successful transaction.' });
    }

    if (aiResult.isEdited) {
      return res.status(400).json({ message: 'Payment verification failed: The screenshot shows signs of editing or tampering.' });
    }

    if (aiResult.amount !== expectedAmount) {
      return res.status(400).json({ 
        message: `Payment verification failed: Expected ₹${expectedAmount} but the screenshot shows a payment of ₹${aiResult.amount}.` 
      });
    }

    // Check unique UTR for manually entered UTR
    const existingManualUTR = await User.findOne({ utrEnteredManually: paymentUTR });
    if (existingManualUTR) {
      return res.status(400).json({ message: 'This manually entered UTR/Ref No. has already been used!' });
    }

    // Check unique UTR from AI extraction (only if it is a real UTR/Ref, not a fallback string)
    const finalAiUtr = aiResult.finalAiUtr;
    if (finalAiUtr && !finalAiUtr.startsWith('NO_UTR_FOUND')) {
      const existingAiUTR = await User.findOne({ utrFetchedFromScreenshot: finalAiUtr });
      if (existingAiUTR) {
        return res.status(400).json({ message: `The UTR/Transaction ID (${finalAiUtr}) from your screenshot has already been used!` });
      }
    }

    const user = new User({
      registrationId,
      name,
      age: finalAge,
      gender,
      email,
      whatsapp,
      institution,
      course,
      semester,
      passwordHash,
      paymentUTR,
      utrEnteredManually: paymentUTR,
      utrFetchedFromScreenshot: finalAiUtr,
      paymentScreenshotUrl,
      expectedAmount,
      verifiedAmount: aiResult.amount,
      verificationStatus: aiResult.status
    });
    await user.save();

    if (selectedEvents && selectedEvents.length > 0) {
      for (const slug of selectedEvents) {
        const eventId = EVENT_ID_MAP[slug];
        if (!eventId) continue;

        try {
          const event = await Event.findOne({ eventId, isActive: true });
          if (!event) continue;

          if (event.individualAllowed) {
            // Register individually
            const reg = new Registration({
              registrationId,
              eventId,
              teamId: null,
              registrationType: 'INDIVIDUAL',
              status: 'CONFIRMED'
            });
            await reg.save();
            queueRegistrationSync(reg, event).catch(err => console.error('[SHEETS INITIAL REG SYNC ERROR]', err.message));
          } else if (event.teamAllowed) {
            // Register team
            const teamId = await generateTeamId();
            const team = new Team({
              teamId,
              eventId,
              leaderId: registrationId,
              status: 'forming',
              memberCount: 1
            });
            await team.save();

            const member = new TeamMember({
              teamId,
              userId: registrationId,
              role: 'Leader'
            });
            await member.save();

            const reg = new Registration({
              registrationId,
              eventId,
              teamId,
              registrationType: 'TEAM',
              status: 'PENDING'
            });
            await reg.save();
          }
        } catch (eventErr) {
          console.error(`Failed to register event ${eventId} on signup:`, eventErr.message);
        }
      }
    }

    // Sync Google Sheets Audit Log (in background)
    appendVerificationRecord({
      name,
      email,
      selectedEvents,
      expectedAmount,
      verifiedAmount: aiResult.amount,
      utrEnteredManually: paymentUTR,
      utrFetchedFromScreenshot: finalAiUtr,
      screenshotUrl: paymentScreenshotUrl,
      status: aiResult.status
    }).catch(err => console.error('[SHEETS AUDIT ERROR]', err.message));

    // Sync Google Sheets Synchronization (in background)
    queueParticipantSync(user).catch(err => console.error('[SHEETS BACKGROUND ERROR] Failed to sync participant:', err.message));

    // 8. Send Response
    res.json({
      success: true,
      registrationId,
      name: user.name
    });
  } catch (error) {
    console.error('Registration processing error:', error);
    res.status(500).json({ message: 'An internal server error occurred during registration.' });
  }
});

module.exports = router;
