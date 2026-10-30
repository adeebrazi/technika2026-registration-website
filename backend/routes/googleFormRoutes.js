const express = require('express');
const router = express.Router();
const { processGoogleFormSubmission, batchProcessGoogleForms } = require('../services/googleFormService');
const DuplicateAttempt = require('../models/DuplicateAttempt');
const { verifyAdminToken } = require('../middleware/role');

/**
 * Normalizes Google Apps Script namedValues or raw JSON into a flat object
 */
const normalizeIncomingPayload = (body) => {
  if (!body) return {};

  // If payload is coming from Google Apps Script with namedValues format:
  // e.g. { namedValues: { "Student Name": ["Aarav"], "Email": ["..."] } }
  if (body.namedValues && typeof body.namedValues === 'object') {
    const flattened = {};
    for (const [key, val] of Object.entries(body.namedValues)) {
      flattened[key] = Array.isArray(val) ? val[0] : val;
    }
    return flattened;
  }

  // If payload is wrapped in { row: { ... } } or direct JSON
  return body.row || body;
};

// @route   POST /api/google-form/webhook
// @desc    Live Webhook for Google Form / Google Apps Script submissions
// @access  Public (Optional Bearer / Webhook Secret verification)
router.post('/webhook', async (req, res) => {
  try {
    const rawPayload = req.body;
    const normalized = normalizeIncomingPayload(rawPayload);

    console.log('[GOOGLE FORM WEBHOOK RECEIVED]:', JSON.stringify(normalized).substring(0, 150));

    const result = await processGoogleFormSubmission(normalized);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Google Form Webhook Router Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/google-form/batch-sync
// @desc    Import or sync an array of Google Form rows from Dashboard
// @access  Private (Admin / Coordinator)
router.post('/batch-sync', verifyAdminToken, async (req, res) => {
  try {
    const rows = req.body.rows || req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ message: 'Payload must include an array of rows.' });
    }

    const normalizedRows = rows.map(r => normalizeIncomingPayload(r));
    const result = await batchProcessGoogleForms(normalizedRows);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Google Form Batch Sync Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/google-form/duplicates
// @desc    Get all silently skipped duplicate attempts for admin review
// @access  Private (Admin / Coordinator)
router.get('/duplicates', verifyAdminToken, async (req, res) => {
  try {
    const duplicates = await DuplicateAttempt.find().sort({ createdAt: -1 }).limit(100);
    return res.json({
      success: true,
      count: duplicates.length,
      duplicates,
    });
  } catch (error) {
    console.error('Error fetching duplicates log:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── AUTOMATED GOOGLE SHEET LIVE SYNC & POLLER ROUTES ──
const {
  syncGoogleSheetNow,
  startGoogleSheetPoller,
  stopGoogleSheetPoller,
  getPollerStatus,
} = require('../services/googleSheetPoller');

// @route   POST /api/google-form/fetch-live
// @desc    Trigger instant auto-fetch from Google Sheet
// @access  Private (Admin / Coordinator)
router.post('/fetch-live', verifyAdminToken, async (req, res) => {
  try {
    const customSheetUrl = req.body.sheetUrl || null;
    const result = await syncGoogleSheetNow(customSheetUrl);
    return res.json(result);
  } catch (error) {
    console.error('Live Fetch Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/google-form/poller-status
// @desc    Get background sync status, last run time, and statistics
// @access  Private (Admin / Coordinator)
router.get('/poller-status', verifyAdminToken, (req, res) => {
  try {
    const status = getPollerStatus();
    return res.json({ success: true, ...status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/google-form/poller-toggle
// @desc    Start or stop automatic periodic polling (e.g. every 60s)
// @access  Private (Admin / Coordinator)
router.post('/poller-toggle', verifyAdminToken, (req, res) => {
  try {
    const { enable, intervalMs } = req.body;
    if (enable) {
      startGoogleSheetPoller(intervalMs || 60000);
    } else {
      stopGoogleSheetPoller();
    }
    const status = getPollerStatus();
    return res.json({ success: true, ...status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

