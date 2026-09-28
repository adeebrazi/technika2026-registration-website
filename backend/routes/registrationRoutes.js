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

const { EVENT_ID_MAP } = require('../utils/eventConstants');


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

    const cleanUTR = (paymentUTR || '').toString().trim();
    if (!cleanUTR) {
      return res.status(400).json({ message: 'Payment UTR / Reference number is required!' });
    }

    if (!/^\d{12}$/.test(cleanUTR)) {
      return res.status(400).json({ message: 'Payment UTR Number must be exactly 12 numeric digits!' });
    }

    // Check unique UTR
    const existingUTR = await User.findOne({ paymentUTR: cleanUTR });
    if (existingUTR) {
      return res.status(400).json({ message: 'This Payment UTR (12-digit Ref No.) has already been used for registration!' });
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
    let parsedEventsInput = [];
    if (req.body.selectedEvents) {
      try {
        parsedEventsInput = JSON.parse(req.body.selectedEvents);
      } catch (e) {
        console.warn('Failed to parse selectedEvents:', e.message);
      }
    }

    // Normalize to array of objects: { slug, mode: 'solo'|'create_team'|'join_team', teamName, teamId }
    const normalizedEvents = [];
    for (const item of parsedEventsInput) {
      if (typeof item === 'string') {
        normalizedEvents.push({ slug: item, mode: 'auto', teamName: '', teamId: '' });
      } else if (item && typeof item === 'object' && item.slug) {
        normalizedEvents.push({
          slug: item.slug,
          mode: item.mode || 'auto',
          teamName: item.teamName ? item.teamName.trim() : '',
          teamId: item.teamId ? item.teamId.trim().toUpperCase() : ''
        });
      }
    }

    // Calculate expected payment amount (Flat Rs. 150)
    let expectedAmount = 0;
    if (normalizedEvents.length > 0) {
      expectedAmount = 150;
    }

    if (expectedAmount === 0) {
      return res.status(400).json({ message: 'You must select at least one event to register!' });
    }

    // Pre-validate join_team codes before processing payment verification
    for (const item of normalizedEvents) {
      if (item.mode === 'join_team') {
        const eventId = EVENT_ID_MAP[item.slug] || item.slug;
        const event = await Event.findOne({ eventId, isActive: true });
        if (!event) continue;

        if (!item.teamId) {
          return res.status(400).json({ message: `Please enter a Team ID to join a team for "${event.name}".` });
        }
        const targetTeam = await Team.findOne({ teamId: item.teamId, eventId });
        if (!targetTeam) {
          return res.status(400).json({ 
            message: `Team "${item.teamId}" was not found for "${event.name}". Please ensure your Team Leader has registered first and given you the correct code.` 
          });
        }
        if (targetTeam.status === 'cancelled') {
          return res.status(400).json({ message: `Team "${item.teamId}" has been cancelled or disbanded.` });
        }
        if (targetTeam.memberCount >= event.maxMembers) {
          return res.status(400).json({ message: `Team "${item.teamId}" is already full (${targetTeam.memberCount}/${event.maxMembers} members).` });
        }
      }
    }

    // AI Screenshot Verification Pipeline
    const aiResult = await verifyPaymentScreenshot(compressedBuffer, req.file.mimetype || 'image/jpeg', paymentScreenshotUrl);

    if (aiResult.status !== 'SUCCESS') {
      return res.status(400).json({ message: 'Payment verification failed: The screenshot does not show a successful completed transaction.' });
    }

    if (aiResult.isEdited) {
      return res.status(400).json({ message: 'Payment verification failed: The screenshot shows signs of digital editing or tampering.' });
    }

    // Security Check: Payee must be ARKA JAIN UNIVERSITY
    if (!aiResult.isPayeeArkaJain) {
      const detectedPayee = aiResult.payeeName || aiResult.payeeUpi || 'an unauthorized recipient';
      return res.status(400).json({ 
        message: `Payment security check failed: Payment must be sent to ARKA JAIN UNIVERSITY (UPI: 3217855a@bandhan). The uploaded receipt shows payment sent to: ${detectedPayee}.` 
      });
    }

    if (aiResult.amount !== expectedAmount) {
      return res.status(400).json({ 
        message: `Payment verification failed: Expected payment of ₹${expectedAmount} for your selected events, but the screenshot shows a payment of ₹${aiResult.amount}.` 
      });
    }

    // Check unique UTR for manually entered UTR
    const existingManualUTR = await User.findOne({ utrEnteredManually: cleanUTR });
    if (existingManualUTR) {
      return res.status(400).json({ message: 'This manually entered 12-digit UTR/Ref No. has already been used!' });
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
      paymentUTR: cleanUTR,
      utrEnteredManually: cleanUTR,
      utrFetchedFromScreenshot: finalAiUtr,
      paymentScreenshotUrl,
      expectedAmount,
      verifiedAmount: aiResult.amount,
      verificationStatus: aiResult.status
    });
    await user.save();

    const createdTeams = [];

    if (normalizedEvents && normalizedEvents.length > 0) {
      for (const item of normalizedEvents) {
        const eventId = EVENT_ID_MAP[item.slug] || item.slug;
        if (!eventId) continue;

        try {
          const event = await Event.findOne({ eventId, isActive: true });
          if (!event) continue;

          let mode = item.mode;
          if (mode === 'auto') {
            if (event.individualAllowed) {
              mode = 'solo';
            } else if (event.teamAllowed) {
              mode = 'create_team';
            }
          }

          if (mode === 'solo' && event.individualAllowed) {
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
          } else if (mode === 'create_team' && event.teamAllowed) {
            // Register as Team Leader
            const newTeamId = await generateTeamId();
            const defaultName = item.teamName ? item.teamName : `${name}'s Team`;
            const isFullTeam = 1 >= event.minMembers;

            const team = new Team({
              teamId: newTeamId,
              teamName: defaultName,
              eventId,
              leaderId: registrationId,
              status: isFullTeam ? 'ready' : 'forming',
              memberCount: 1
            });
            await team.save();

            const member = new TeamMember({
              teamId: newTeamId,
              userId: registrationId,
              role: 'Leader'
            });
            await member.save();

            const reg = new Registration({
              registrationId,
              eventId,
              teamId: newTeamId,
              registrationType: 'TEAM',
              status: 'CONFIRMED'
            });
            await reg.save();
            queueRegistrationSync(reg, event).catch(err => console.error('[SHEETS INITIAL REG SYNC ERROR]', err.message));

            createdTeams.push({
              eventId,
              eventName: event.name,
              teamId: newTeamId,
              teamName: defaultName,
              minMembers: event.minMembers,
              maxMembers: event.maxMembers
            });
          } else if (mode === 'join_team' && event.teamAllowed) {
            // Join Friend's Team
            const cleanTeamId = item.teamId;
            const targetTeam = await Team.findOne({ teamId: cleanTeamId, eventId });
            if (targetTeam) {
              const member = new TeamMember({
                teamId: cleanTeamId,
                userId: registrationId,
                role: 'Member'
              });
              await member.save();

              targetTeam.memberCount += 1;
              if (targetTeam.memberCount >= event.minMembers && targetTeam.status === 'forming') {
                targetTeam.status = 'ready';
              }
              await targetTeam.save();

              const reg = new Registration({
                registrationId,
                eventId,
                teamId: cleanTeamId,
                registrationType: 'TEAM',
                status: 'CONFIRMED'
              });
              await reg.save();
              queueRegistrationSync(reg, event).catch(err => console.error('[SHEETS INITIAL REG SYNC ERROR]', err.message));

              // Notify Team Leader
              const leaderNotif = new Notification({
                userId: targetTeam.leaderId,
                type: 'SYSTEM',
                message: `${name} (${registrationId}) has joined your team (${cleanTeamId}) for ${event.name}!`
              });
              await leaderNotif.save().catch(e => console.warn('Notif error:', e.message));
            }
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
      selectedEvents: normalizedEvents.map(e => e.slug),
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
      name: user.name,
      createdTeams
    });
  } catch (error) {
    console.error('Registration processing error:', error);
    res.status(500).json({ message: 'An internal server error occurred during registration.' });
  }
});

module.exports = router;
