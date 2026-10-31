const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const DuplicateAttempt = require('../models/DuplicateAttempt');
const { EVENT_ID_MAP } = require('../utils/eventConstants');

// Helper to generate unique 6-character registration ID
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

// Normalize string for fuzzy comparison
const normalizeStr = (str) => {
  return (str || '')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Resolves event string/array into array of DB Event documents
 */
const resolveEvents = async (rawEventsInput, allEvents) => {
  if (!rawEventsInput) return [];

  let candidates = [];
  if (Array.isArray(rawEventsInput)) {
    candidates = rawEventsInput;
  } else if (typeof rawEventsInput === 'string') {
    candidates = rawEventsInput.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }

  const matchedEventIds = new Set();
  const matchedEvents = [];

  for (const item of candidates) {
    const rawClean = item.trim();
    if (!rawClean) continue;
    const cleanNorm = normalizeStr(rawClean);

    // Special category bulk matches:
    if (rawClean.toUpperCase() === 'ALL_TECHNICAL' || rawClean.toUpperCase() === 'ALL TECHNICAL EVENTS') {
      const techEvs = allEvents.filter(e => e.eventId.startsWith('TECH_') || (e.category && e.category.toLowerCase().includes('tech')));
      techEvs.forEach(e => {
        if (!matchedEventIds.has(e.eventId)) {
          matchedEventIds.add(e.eventId);
          matchedEvents.push(e);
        }
      });
      continue;
    }

    if (rawClean.toUpperCase() === 'ALL_CULTURAL' || rawClean.toUpperCase() === 'ALL CULTURAL EVENTS') {
      const culEvs = allEvents.filter(e => e.eventId.startsWith('CUL_') || (e.category && e.category.toLowerCase().includes('cult')));
      culEvs.forEach(e => {
        if (!matchedEventIds.has(e.eventId)) {
          matchedEventIds.add(e.eventId);
          matchedEvents.push(e);
        }
      });
      continue;
    }

    if (rawClean.toUpperCase() === 'ALL_CREATIVE' || rawClean.toUpperCase() === 'ALL CREATIVE EVENTS') {
      const creEvs = allEvents.filter(e => e.eventId.startsWith('CRE_') || (e.category && e.category.toLowerCase().includes('creat')));
      creEvs.forEach(e => {
        if (!matchedEventIds.has(e.eventId)) {
          matchedEventIds.add(e.eventId);
          matchedEvents.push(e);
        }
      });
      continue;
    }

    if (rawClean.toUpperCase() === 'ALL EVENTS') {
      allEvents.forEach(e => {
        if (!matchedEventIds.has(e.eventId)) {
          matchedEventIds.add(e.eventId);
          matchedEvents.push(e);
        }
      });
      continue;
    }

    // 1. Direct match by Event ID
    let found = allEvents.find(e => e.eventId.toUpperCase() === rawClean.toUpperCase());

    // 2. Slug match via EVENT_ID_MAP
    if (!found && EVENT_ID_MAP[rawClean.toLowerCase()]) {
      const mappedId = EVENT_ID_MAP[rawClean.toLowerCase()];
      found = allEvents.find(e => e.eventId === mappedId);
    }

    // 3. Exact Name match (case-insensitive)
    if (!found) {
      found = allEvents.find(e => e.name.toLowerCase() === rawClean.toLowerCase());
    }

    // 4. Normalized substring / acronym match
    if (!found) {
      found = allEvents.find(e => {
        const eventNorm = normalizeStr(e.name);
        return eventNorm.includes(cleanNorm) || cleanNorm.includes(eventNorm);
      });
    }

    if (found && !matchedEventIds.has(found.eventId)) {
      matchedEventIds.add(found.eventId);
      matchedEvents.push(found);
    }
  }

  // Fallback default event if none matched (e.g. general quiz)
  if (matchedEvents.length === 0 && allEvents.length > 0) {
    const defaultEv = allEvents.find(e => e.eventId === 'TECH_IQ') || allEvents[0];
    matchedEvents.push(defaultEv);
  }

  return matchedEvents;
};

const getField = (obj, candidateKeys, defaultValue = '') => {
  if (!obj || typeof obj !== 'object') return defaultValue;

  const rawKeys = [];
  const lowerKeys = {};

  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      lowerKeys[norm] = String(val).trim();
      rawKeys.push({ raw: k.toLowerCase().replace(/\s+/g, ' '), norm, val: String(val).trim() });
    }
  }

  // 1. Exact normalized match
  for (const c of candidateKeys) {
    const norm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (lowerKeys[norm] !== undefined) {
      return lowerKeys[norm];
    }
  }

  // 2. Substring match (handles multiline headers with help text, drop-down notes, etc.)
  for (const c of candidateKeys) {
    const norm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const item of rawKeys) {
      if (item.norm.includes(norm) || item.raw.includes(c.toLowerCase())) {
        // Prevent 'current education status' from matching when looking for institute/school name
        if (item.raw.includes('current education status') && !c.toLowerCase().includes('education') && !c.toLowerCase().includes('status')) {
          continue;
        }
        return item.val;
      }
    }
  }

  return defaultValue;
};

/**
 * Process a single Google Form submission with silent deduplication
 */
const processGoogleFormSubmission = async (payload) => {
  try {
    // 1. Normalize and extract incoming payload fields flexibly
    const name = getField(payload, ['name', 'studentname', 'fullname', 'nameofstudent']);
    const rawEmail = getField(payload, ['email', 'emailaddress', 'parentemail', 'mail']).toLowerCase();
    const phone = getField(payload, ['contactnumber', 'contact', 'whatsapp', 'whatsappnumber', 'phone', 'phonenumber', 'mobilenumber']);
    
    // Extract institution from restructured Google Form column
    const rawInst = getField(payload, [
      'schoolcollegeuniversityname',
      'schoolcollegename',
      'schoolcollegeuniversity',
      'schoolcollege',
      'institution',
      'institutename',
      'collegename',
      'schoolname'
    ], '');
    const institution = rawInst || 'Others';

    // Current Education Status (e.g. SCHOOL, COLLEGE, DIPLOMA, B.TECH)
    const course = getField(payload, [
      'currenteducationstatus',
      'educationstatus',
      'course',
      'stream',
      'category'
    ], 'School Student');

    // Semester / Standard (e.g. Class 8, Class 9, Class 11, Class 12, Sem 3)
    const semester = getField(payload, [
      'semesterstandard',
      'semester',
      'standard',
      'class',
      'grade'
    ], 'N/A');

    const rawUtr = getField(payload, ['transactionutrnumber', 'transactionutr', 'paymentutr', 'utr', 'transactionid', 'upireferenceno', 'referencenumber', 'upiref']);
    const screenshotUrl = getField(payload, ['uploadpaymentscreenshot', 'paymentscreenshoturl', 'screenshoturl', 'screenshot', 'paymentscreenshot', 'receipt'], '');
    
    // Events can be array, string, or split across Technical, Cultural, Creative columns
    let eventsInput = payload.events || payload.Events || payload.EVENTS || payload['Selected Events'] || payload['Event Name'] || [];
    if (typeof eventsInput === 'string' && eventsInput.trim()) {
      eventsInput = eventsInput.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(eventsInput)) {
      eventsInput = [];
    }

    const techCol = getField(payload, ['technicalevents', 'techevents', 'technical']);
    if (techCol) {
      if (techCol.trim().toUpperCase() === 'ALL EVENTS') {
        eventsInput.push('ALL_TECHNICAL');
      } else {
        eventsInput.push(...techCol.split(/[,;\n]/).map(s => s.trim()).filter(Boolean));
      }
    }

    const cultCol = getField(payload, ['culturalevents', 'cultevents', 'cultural']);
    if (cultCol) {
      if (cultCol.trim().toUpperCase() === 'ALL EVENTS') {
        eventsInput.push('ALL_CULTURAL');
      } else {
        eventsInput.push(...cultCol.split(/[,;\n]/).map(s => s.trim()).filter(Boolean));
      }
    }

    const creatCol = getField(payload, ['creativeevents', 'creaevents', 'creative']);
    if (creatCol) {
      if (creatCol.trim().toUpperCase() === 'ALL EVENTS') {
        eventsInput.push('ALL_CREATIVE');
      } else {
        eventsInput.push(...creatCol.split(/[,;\n]/).map(s => s.trim()).filter(Boolean));
      }
    }
    
    const rawGender = getField(payload, ['gender', 'sex'], '');
    let gender = 'Other';
    if (rawGender) {
      const g = rawGender.toLowerCase().trim();
      if (g.startsWith('m')) gender = 'Male';
      else if (g.startsWith('f')) gender = 'Female';
    }

    // Must have at least a Name
    if (!name) {
      return { success: false, error: 'Student name is missing in form entry.' };
    }

    // Ensure email exists or construct a fallback parent contact identifier
    const email = rawEmail || `school_${phone || Date.now()}@technika-participant.local`;

    // 2. Fetch all events for reference
    const allEvents = await Event.find({ isActive: true });

    // ── 3. TIERED SILENT DEDUPLICATION ──
    let matchedUser = null;
    let matchReason = '';

    // Check A: Same Name + Same Email (Multiple students are allowed to share an email address)
    if (rawEmail && name) {
      const candidates = await User.find({ email });
      for (const cand of candidates) {
        if (normalizeStr(cand.name) === normalizeStr(name)) {
          matchedUser = cand;
          matchReason = 'EMAIL_AND_NAME_MATCH';
          break;
        }
      }
    }

    // Check B: Phone + Name Match (same contact + student name)
    if (!matchedUser && phone && phone.length >= 8) {
      const phoneDigits = phone.replace(/[^0-9]/g, '').slice(-10);
      const candidates = await User.find({
        whatsapp: { $regex: phoneDigits }
      });
      for (const cand of candidates) {
        if (normalizeStr(cand.name) === normalizeStr(name)) {
          matchedUser = cand;
          matchReason = 'PHONE_AND_NAME_MATCH';
          break;
        }
      }
    }

    // Check C: Exact UTR + Same Student Name Match
    if (!matchedUser && rawUtr && rawUtr.length >= 6) {
      const utrUser = await User.findOne({
        $or: [
          { paymentUTR: rawUtr },
          { utrEnteredManually: rawUtr }
        ]
      });
      if (utrUser && normalizeStr(utrUser.name) === normalizeStr(name)) {
        matchedUser = utrUser;
        matchReason = 'UTR_AND_NAME_MATCH';
      }
    }

    // Check D: Name + School Match
    if (!matchedUser && institution && institution !== 'School Student' && institution !== 'Others') {
      const candidates = await User.find({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      for (const cand of candidates) {
        if (normalizeStr(cand.institution) === normalizeStr(institution)) {
          matchedUser = cand;
          matchReason = 'NAME_AND_INSTITUTION_MATCH';
          break;
        }
      }
    }

    // ── IF DUPLICATE IS FOUND: SILENT SKIP ──
    if (matchedUser) {
      console.log(`[DUPLICATE DETECTED] Skipped duplicate entry for "${name}" (Matched ID: ${matchedUser.registrationId}, Reason: ${matchReason})`);
      
      // Log attempt silently without sending ANY email
      await DuplicateAttempt.create({
        source: 'google_form',
        attemptedName: name,
        attemptedEmail: email,
        attemptedPhone: phone,
        attemptedUtr: rawUtr,
        attemptedInstitution: institution,
        attemptedCourse: course,
        attemptedSemester: semester,
        attemptedEvents: Array.isArray(eventsInput) ? eventsInput : [String(eventsInput)],
        matchedUser: {
          registrationId: matchedUser.registrationId,
          name: matchedUser.name,
          email: matchedUser.email,
          whatsapp: matchedUser.whatsapp,
          paymentUTR: matchedUser.paymentUTR,
          institution: matchedUser.institution,
        },
        matchReason,
        status: 'SKIPPED',
        rawPayload: payload,
      });

      return {
        success: true,
        duplicate: true,
        status: 'DUPLICATE_SKIPPED',
        matchReason,
        registrationId: matchedUser.registrationId,
        message: `Duplicate detected (${matchReason}). Silently skipped without re-emailing.`,
      };
    }

    // ── 4. RESOLVE EVENTS FOR NEW UNIQUE PARTICIPANT ──
    const resolvedEvents = await resolveEvents(eventsInput, allEvents);

    // ── 5. HANDLE BATCH / SIBLING UTR COLLISION ──
    let finalUtr = rawUtr || `GFORM-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const existingUtr = await User.findOne({
      $or: [{ paymentUTR: finalUtr }, { utrEnteredManually: finalUtr }]
    });

    if (existingUtr) {
      // Sibling or contingent batch payment with same UTR
      const siblingCount = await User.countDocuments({
        paymentUTR: { $regex: `^${finalUtr}` }
      });
      finalUtr = `${finalUtr}-S${siblingCount + 1}`;
    }

    // ── 6. CREATE USER AND REGISTRATIONS ──
    const registrationId = await generateRegistrationId();
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const newUser = new User({
      registrationId,
      name,
      gender,
      email,
      whatsapp: phone || 'N/A',
      institution,
      course,
      semester,
      passwordHash,
      paymentUTR: finalUtr,
      utrEnteredManually: finalUtr,
      paymentScreenshotUrl: screenshotUrl || 'https://technika.online/assets/offline-receipt.png',
      expectedAmount: 100,
      verifiedAmount: 100,
      verificationStatus: 'SUCCESS',
      source: 'google_form',
    });

    await newUser.save();

    // Create event registrations
    for (const ev of resolvedEvents) {
      await Registration.create({
        registrationId,
        eventId: ev.eventId,
        registrationType: ev.teamAllowed ? 'TEAM' : 'INDIVIDUAL',
        status: 'CONFIRMED',
      });
    }

    // Save to dedicated Google_Form_Allotted sheet tab
    try {
      const { appendGoogleFormAllotted } = require('./sheetsService');
      await appendGoogleFormAllotted(newUser, resolvedEvents);
    } catch (sheetErr) {
      console.warn('[GOOGLE FORM SHEET SYNC ERROR]:', sheetErr.message);
    }

    console.log(`[GOOGLE FORM REGISTERED] Created registration ${registrationId} for ${name} (${resolvedEvents.length} events).`);

    return {
      success: true,
      duplicate: false,
      status: 'REGISTERED',
      registrationId,
      name,
      email,
      events: resolvedEvents.map(e => e.name),
    };
  } catch (error) {
    console.error('[GOOGLE FORM PROCESS ERROR]:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Batch processes an array of Google Form submissions (e.g. from Google Sheet sync or CSV)
 */
const batchProcessGoogleForms = async (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { total: 0, registered: 0, duplicatesSkipped: 0, errors: [] };
  }

  let registeredCount = 0;
  let duplicatesSkippedCount = 0;
  const errors = [];
  const processedResults = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const res = await processGoogleFormSubmission(row);
    processedResults.push(res);

    if (res.success) {
      if (res.duplicate) {
        duplicatesSkippedCount++;
      } else {
        registeredCount++;
      }
    } else {
      errors.push({ row: i + 1, error: res.error || 'Unknown error' });
    }
  }

  return {
    total: rows.length,
    registered: registeredCount,
    duplicatesSkipped: duplicatesSkippedCount,
    errors,
    results: processedResults,
  };
};

module.exports = {
  processGoogleFormSubmission,
  batchProcessGoogleForms,
};
