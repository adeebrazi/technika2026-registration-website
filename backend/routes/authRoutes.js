const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Otp = require('../models/Otp');
const auth = require('../middleware/auth');
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { registrationIdOrEmail, password } = req.body;

  try {
    if (!registrationIdOrEmail || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    let query = {};
    if (registrationIdOrEmail.includes('@')) {
      query = { email: registrationIdOrEmail.toLowerCase().trim() };
    } else {
      query = { registrationId: registrationIdOrEmail.toUpperCase().trim() };
    }

    const user = await User.findOne(query);
    const genericErrorMessage = 'Invalid credentials. Please check your Registration ID/Email and Password.';

    if (!user) {
      return res.status(400).json({ message: genericErrorMessage });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: genericErrorMessage });
    }

    const payload = {
      id: user._id,
      registrationId: user.registrationId,
      email: user.email,
      name: user.name
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super_secret_jwt_key_123456',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          user: {
            registrationId: user.registrationId,
            name: user.name,
            email: user.email
          }
        });
      }
    );

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile and registered events
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ registrationId: req.user.registrationId }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Fetch user event registrations
    const registrations = await Registration.find({ 
      registrationId: req.user.registrationId,
      status: { $in: ['CONFIRMED', 'PENDING'] }
    });

    res.json({
      success: true,
      user,
      registeredEvents: registrations
    });
  } catch (error) {
    console.error('Fetch profile error:', error.message);
    res.status(500).json({ message: 'Server error while fetching profile details.' });
  }
});


// @route   PUT /api/auth/profile
// @desc    Update participant profile details (excluding email, utr, password, registrationId)
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, age, gender, whatsapp, institution, course, semester } = req.body;

  try {
    const user = await User.findOne({ registrationId: req.user.registrationId });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name;
    if (age) user.age = parseInt(age);
    if (gender) {
      if (!['Male', 'Female'].includes(gender)) {
        return res.status(400).json({ message: 'Gender must be Male or Female.' });
      }
      user.gender = gender;
    }
    if (whatsapp) user.whatsapp = whatsapp;
    if (institution) user.institution = institution;
    if (course) user.course = course;
    if (semester) user.semester = semester;

    await user.save();

    // Queue update to sync with Google Sheets
    const { queueParticipantSync } = require('../services/sheetsService');
    queueParticipantSync(user);

    res.json({
      success: true,
      message: 'Profile details updated successfully!',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error while updating profile details.' });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP for email verification
// @access  Public
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to DB (upsert if one already exists for this email)
    await Otp.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send email
    const { sendOtpEmail } = require('../utils/emailService');
    await sendOtpEmail(email.toLowerCase().trim(), otp);

    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

  try {
    const otpRecord = await Otp.findOne({ email: email.toLowerCase().trim() });
    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
    }

    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP is valid. Delete it so it can't be reused.
    await Otp.deleteOne({ email: email.toLowerCase().trim() });

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Failed to verify OTP.' });
  }
});

module.exports = router;
