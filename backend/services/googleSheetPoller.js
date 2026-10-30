const https = require('https');
const http = require('http');
const { URL } = require('url');
const { processGoogleFormSubmission } = require('./googleFormService');

const DEFAULT_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || 
  'https://docs.google.com/spreadsheets/d/1hWZJ3hMST-DJeacL0yV7pgdR_-G-Wvl3jA139_VzHoA/export?format=csv&gid=557352837';

// Poller state
const pollerState = {
  isRunning: false,
  timerId: null,
  sheetUrl: DEFAULT_SHEET_CSV_URL,
  lastSyncTime: null,
  lastSyncStatus: 'IDLE',
  lastError: null,
  totalRowsProcessed: 0,
  totalRegistered: 0,
  totalDuplicatesSkipped: 0,
  history: [],
};

/**
 * Fetch raw CSV data following HTTP 301/302/307 redirects
 */
const fetchCsvWithRedirect = (targetUrl, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects while fetching Google Sheet.'));
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(targetUrl, (res) => {
        // Handle HTTP redirect (Google Sheets 307 to doc-*-sheets.googleusercontent.com)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectTarget = new URL(res.headers.location, targetUrl).toString();
          return resolve(fetchCsvWithRedirect(redirectTarget, maxRedirects - 1));
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Google Sheet returned HTTP ${res.statusCode}: ${res.statusMessage}`));
        }

        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          resolve(rawData);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Timeout while fetching Google Sheet CSV.'));
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Robust RFC 4180 CSV Parser
 * Handles commas inside double quotes, escaped quotes (""), and multiline cells
 */
const parseCsv = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return [];

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      // Handle CRLF or LF
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';

      // Only push non-empty rows
      if (currentRow.some(col => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push final trailing field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  // Extract headers
  const headers = rows[0].map(h => h.trim());
  const dataRows = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowObj = {};
    for (let c = 0; c < headers.length; c++) {
      const headerKey = headers[c];
      rowObj[headerKey] = row[c] !== undefined ? row[c] : '';
    }
    dataRows.push(rowObj);
  }

  return dataRows;
};

/**
 * Executes a single sync cycle from the Google Sheet
 */
const syncGoogleSheetNow = async (customSheetUrl = null) => {
  const urlToFetch = customSheetUrl || pollerState.sheetUrl;
  console.log(`[SHEET POLLER] Starting live sync from: ${urlToFetch}`);

  try {
    const csvContent = await fetchCsvWithRedirect(urlToFetch);
    const parsedRows = parseCsv(csvContent);

    console.log(`[SHEET POLLER] Successfully fetched ${parsedRows.length} active participant rows from sheet.`);

    let newlyRegistered = 0;
    let duplicatesSkipped = 0;
    const errors = [];
    const syncResults = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      try {
        const result = await processGoogleFormSubmission(row);
        syncResults.push(result);

        if (result.success) {
          if (result.duplicate) {
            duplicatesSkipped++;
          } else {
            newlyRegistered++;
          }
        } else {
          errors.push({ row: i + 2, student: row.NAME || row.name, error: result.error });
        }
      } catch (rowErr) {
        errors.push({ row: i + 2, student: row.NAME || row.name, error: rowErr.message });
      }
    }

    // Update state
    pollerState.lastSyncTime = new Date();
    pollerState.lastSyncStatus = 'SUCCESS';
    pollerState.lastError = null;
    pollerState.totalRowsProcessed = parsedRows.length;
    pollerState.totalRegistered += newlyRegistered;
    pollerState.totalDuplicatesSkipped += duplicatesSkipped;

    const summary = {
      success: true,
      timestamp: pollerState.lastSyncTime,
      totalRowsInSheet: parsedRows.length,
      newlyRegistered,
      duplicatesSkipped,
      errorsCount: errors.length,
      errors,
    };

    pollerState.history.unshift({
      time: pollerState.lastSyncTime,
      total: parsedRows.length,
      registered: newlyRegistered,
      skipped: duplicatesSkipped,
    });
    if (pollerState.history.length > 20) pollerState.history.pop();

    console.log(`[SHEET POLLER SYNC COMPLETE] Sheet Rows: ${parsedRows.length} | Newly Registered: ${newlyRegistered} | Skipped Duplicates: ${duplicatesSkipped} | Errors: ${errors.length}`);

    return summary;
  } catch (error) {
    console.error('[SHEET POLLER ERROR]:', error.message);
    pollerState.lastSyncTime = new Date();
    pollerState.lastSyncStatus = 'ERROR';
    pollerState.lastError = error.message;

    return {
      success: false,
      timestamp: pollerState.lastSyncTime,
      error: error.message,
    };
  }
};

/**
 * Start periodic background polling (e.g. every 60 seconds)
 */
const startGoogleSheetPoller = (intervalMs = 60000) => {
  if (pollerState.isRunning) {
    console.log('[SHEET POLLER] Poller is already active.');
    return;
  }

  pollerState.isRunning = true;
  console.log(`[SHEET POLLER] Background auto-sync started (Interval: ${intervalMs / 1000}s)`);

  // Run initial sync after 3 seconds
  setTimeout(() => {
    syncGoogleSheetNow();
  }, 3000);

  // Set recurring interval
  pollerState.timerId = setInterval(() => {
    syncGoogleSheetNow();
  }, intervalMs);
};

/**
 * Stop periodic background polling
 */
const stopGoogleSheetPoller = () => {
  if (pollerState.timerId) {
    clearInterval(pollerState.timerId);
    pollerState.timerId = null;
  }
  pollerState.isRunning = false;
  console.log('[SHEET POLLER] Background auto-sync stopped.');
};

/**
 * Get current poller status
 */
const getPollerStatus = () => {
  return {
    isRunning: pollerState.isRunning,
    sheetUrl: pollerState.sheetUrl,
    lastSyncTime: pollerState.lastSyncTime,
    lastSyncStatus: pollerState.lastSyncStatus,
    lastError: pollerState.lastError,
    totalRowsProcessed: pollerState.totalRowsProcessed,
    totalRegistered: pollerState.totalRegistered,
    totalDuplicatesSkipped: pollerState.totalDuplicatesSkipped,
    history: pollerState.history,
  };
};

module.exports = {
  syncGoogleSheetNow,
  startGoogleSheetPoller,
  stopGoogleSheetPoller,
  getPollerStatus,
  fetchCsvWithRedirect,
  parseCsv,
};
