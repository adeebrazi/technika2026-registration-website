const mongoose = require('mongoose');

const RolePermissionSchema = new mongoose.Schema({
  targetKey: {
    type: String, // 'faculty' | 'coordinator' | or specific email
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  // ── WHAT THEY CAN SEE (View / Read Access) ──
  canViewParticipants: { type: Boolean, default: true },
  canViewContactInfo: { type: Boolean, default: true },
  canViewFinancials: { type: Boolean, default: false },
  canViewDocuments: { type: Boolean, default: false },
  canViewTeams: { type: Boolean, default: true },
  canViewAnalytics: { type: Boolean, default: true },
  canViewDeveloperHub: { type: Boolean, default: false },

  // ── WHAT THEY CAN EDIT (Action / Write Access) ──
  canVerifyPayments: { type: Boolean, default: false },
  canDeleteParticipants: { type: Boolean, default: false },
  canEditTeams: { type: Boolean, default: false },
  canExportCSV: { type: Boolean, default: false },
  canCheckInParticipants: { type: Boolean, default: true },

  // ── EVENT SCOPE ──
  assignedEvents: [{ type: String }], // empty = all events

  updatedBy: { type: String, default: 'Administrator' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RolePermission', RolePermissionSchema);
