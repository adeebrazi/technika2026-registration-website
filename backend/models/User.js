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
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return v.endsWith('@gmail.com');
        },
        message: props => `${props.value} is not a valid Gmail address! Registration requires a Gmail account.`
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
      required: true,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
