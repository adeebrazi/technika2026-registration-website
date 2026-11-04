const mongoose = require('mongoose');

const SyncLockSchema = new mongoose.Schema(
  {
    lockName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lockedUntil: {
      type: Date,
      required: true,
      default: () => new Date(0),
    },
    lastSyncedAt: {
      type: Date,
      default: () => new Date(0),
    },
    acquiredBy: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SyncLock', SyncLockSchema);
