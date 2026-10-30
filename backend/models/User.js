const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 6,
      maxlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: false,
    },
    gender: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          if (this.source === 'google_form' || this.source === 'admin_import') {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          }
          return v.endsWith('@gmail.com');
        },
        message: props => `${props.value} is not a valid email address! Registration requires a Gmail account.`
      }
    },
    whatsapp: {
      type: String,
      required: true,
      trim: true,
    },
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    paymentUTR: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    utrEnteredManually: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    utrFetchedFromScreenshot: {
      type: String,
      trim: true,
    },
    paymentScreenshotUrl: {
      type: String,
      required: function() {
        return !this.source || this.source === 'website';
      },
      default: '',
    },
    expectedAmount: {
      type: Number,
      required: true,
    },
    verifiedAmount: {
      type: Number,
      default: 0,
    },
    verificationStatus: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING', 'UNKNOWN'],
      default: 'PENDING',
    },
    isRegistrationFrozen: {
      type: Boolean,
      default: false,
    },
    isAjuExempt: {
      type: Boolean,
      default: false,
    },
    noDuesSlipUrl: {
      type: String,
      default: null,
    },
    collegeIdCardUrl: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      enum: ['website', 'google_form', 'admin_import'],
      default: 'website',
    },
    confirmationEmailSent: {
      type: Boolean,
      default: false,
    },
    confirmationEmailSentAt: {
      type: Date,
      default: null,
    },
    confirmationEmailSentBy: {
      type: String,
      default: null,
    },
    qrEmailSent: {
      type: Boolean,
      default: false,
    },
    qrEmailSentAt: {
      type: Date,
      default: null,
    },
    qrEmailSentBy: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
