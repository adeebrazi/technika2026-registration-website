const mongoose = require('mongoose');

const DuplicateAttemptSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      default: 'google_form',
    },
    attemptedName: {
      type: String,
      trim: true,
    },
    attemptedEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    attemptedPhone: {
      type: String,
      trim: true,
    },
    attemptedUtr: {
      type: String,
      trim: true,
    },
    attemptedInstitution: {
      type: String,
      trim: true,
    },
    attemptedCourse: {
      type: String,
      trim: true,
    },
    attemptedSemester: {
      type: String,
      trim: true,
    },
    attemptedEvents: [
      {
        type: String,
        trim: true,
      }
    ],
    matchedUser: {
      registrationId: String,
      name: String,
      email: String,
      whatsapp: String,
      paymentUTR: String,
      institution: String,
    },
    matchReason: {
      type: String, // 'EMAIL_ALREADY_REGISTERED', 'UTR_AND_NAME_MATCH', 'PHONE_AND_NAME_MATCH', 'NAME_AND_INSTITUTION_MATCH'
    },
    status: {
      type: String,
      enum: ['SKIPPED', 'REVIEW_REQUIRED', 'RESOLVED'],
      default: 'SKIPPED',
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DuplicateAttempt', DuplicateAttemptSchema);
