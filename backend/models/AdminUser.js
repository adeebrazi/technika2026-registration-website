const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'coordinator', 'volunteer'],
      default: 'coordinator',
      required: true,
    },
    designation: {
      type: String,
      default: 'Staff Member',
      trim: true,
    },
    // Granular permissions stored directly in database:
    permissions: {
      canViewPhone: { type: Boolean, default: false },
      canViewEmail: { type: Boolean, default: false },
      canSendEmail: { type: Boolean, default: false },
      canVerifyPayments: { type: Boolean, default: false },
      canCheckIn: { type: Boolean, default: true },
      canExportCSV: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false },
      canViewContact: { type: Boolean, default: false }, // backward compat
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: 'adeeb@technika2026.online',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdminUser', AdminUserSchema);
