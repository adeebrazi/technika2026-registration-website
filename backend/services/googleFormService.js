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

// Canonical approved institution resolution
const getCanonicalInstitution = (raw) => {
  if (!raw) return 'OTHERS';
  const str = raw.trim();
  const lower = str.toLowerCase();

  if (lower.includes('arka') || lower.includes('jain') || lower === 'aju' || lower.includes('law department')) {
    return 'ARKA JAIN UNIVERSITY';
  }
  if (lower.includes('women') && (lower.includes('poly') || lower.includes('poli'))) {
    return "WOMEN'S POLYTECHNIC, GAMHARIA";
  }
  if (lower.includes('chandil')) return 'CHANDIL POLYTECHNIC';
  if (lower.includes('icfai')) return 'THE ICFAI UNIVERSITY, JHARKHAND, RANCHI';
  if (lower.includes('karim')) return 'KARIM CITY COLLEGE - SAKCHI';
  if (lower.includes('church school')) return 'CHURCH SCHOOL BELDIH';
  if (lower.includes('cm school') || lower.includes('burmamines')) return 'BPM +2 HIGH SCHOOL, BURMAMINES';
  if (lower.includes('d.a.v') || lower.includes('dav')) return 'DAV PUBLIC SCHOOL, ADITYAPUR';
  if (lower.includes('b.a.') || lower.includes('b.a')) return 'B.A. COLLEGE OF ENGINEERING AND TECHNOLOGY';
  if (lower.includes('krishna') || lower === 'school') return 'SRI KRISHNA PUBLIC SCHOOL';
  if (lower.includes('tata steel technical') || lower.includes('tsti')) return 'TATA STEEL TECHNICAL INSTITUTE';
  if (lower.includes('dbms')) return 'DBMS ENGLISH SCHOOL';
  if (lower.includes('polytechnic') && lower.includes('adityapur')) return 'GOVERNMENT POLYTECHNIC, ADITYAPUR';
  if (lower.includes('govind')) return 'GOVIND VIDYALAYA, TAMULIA';
  if (lower.includes('gulmohar')) return 'GULMOHAR HIGH SCHOOL';
  if (lower.includes('danish') || lower.includes('idtr')) return 'INDO DANISH TOOL ROOM, JAMSHEDPUR';
  if (lower.includes('nit') || lower.includes('national institute of technology')) return 'NATIONAL INSTITUTE OF TECHNOLOGY (NIT), JAMSHEDPUR';
  if (lower.includes('netaji') || lower.includes('nsu')) return 'NETAJI SUBHAS UNIVERSITY, JAMSHEDPUR';
  if (lower.includes('srinath public')) return 'SRINATH PUBLIC SCHOOL, JAMSHEDPUR';
  if (lower.includes('central university of jharkhand') || lower.includes('cuj')) return 'CENTRAL UNIVERSITY OF JHARKHAND, RANCHI';
  if (lower.includes('al-kabir') || lower.includes('alkabir')) return 'AL-KABIR POLYTECHNIC';
  if (lower.includes('al-karim') || lower.includes('alkarim')) return 'AL-KARIM UNIVERSITY';
  if (lower.includes('atomic')) return 'ATOMIC ENERGY CENTRAL SCHOOL';
  if (lower.includes('amity')) return 'AMITY UNIVERSITY PATNA';

  return str.toUpperCase();
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
    const institution = getCanonicalInstitution(rawInst);

    const formTimestamp = getField(payload, ['timestamp', 'time', 'date', 'submittedat'], '');

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

    // ── 3. DEDUPLICATION ENGINE: ONLY COMPARE GOOGLE FORM AGAINST WEBSITE ──
    // Website responses are left as-is. If an OG Google Form entry duplicates a Website registration,
    // skip it so it is not added to Google Form Allotted sheet.
    let matchedWebsiteUser = null;
    let matchReason = '';

    // Check A: Email match with Website registration
    if (rawEmail) {
      const websiteEmailMatch = await User.findOne({
        source: 'website',
        email: rawEmail
      });
      if (websiteEmailMatch) {
        matchedWebsiteUser = websiteEmailMatch;
        matchReason = 'WEBSITE_EMAIL_MATCH';
      }
    }

    // Check B: Phone + Name match with Website registration
    if (!matchedWebsiteUser && phone && phone.length >= 8) {
      const phoneDigits = phone.replace(/[^0-9]/g, '').slice(-10);
      const candidates = await User.find({
        source: 'website',
        whatsapp: { $regex: phoneDigits }
      });
      for (const cand of candidates) {
        if (normalizeStr(cand.name) === normalizeStr(name)) {
          matchedWebsiteUser = cand;
          matchReason = 'WEBSITE_PHONE_AND_NAME_MATCH';
          break;
        }
      }
    }

    // Check C: Exact UTR match with Website registration
    if (!matchedWebsiteUser && rawUtr && rawUtr.length >= 6) {
      const utrUser = await User.findOne({
        source: 'website',
        $or: [
          { paymentUTR: rawUtr },
          { utrEnteredManually: rawUtr }
        ]
      });
      if (utrUser && normalizeStr(utrUser.name) === normalizeStr(name)) {
        matchedWebsiteUser = utrUser;
        matchReason = 'WEBSITE_UTR_MATCH';
      }
    }

    // Check D: Name + School Match with Website registration
    if (!matchedWebsiteUser && institution && institution !== 'School Student' && institution !== 'Others') {
      const candidates = await User.find({
        source: 'website',
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      for (const cand of candidates) {
        if (normalizeStr(cand.institution) === normalizeStr(institution)) {
          matchedWebsiteUser = cand;
          matchReason = 'WEBSITE_NAME_AND_INSTITUTION_MATCH';
          break;
        }
      }
    }

    // ── IF DUPLICATE OF WEBSITE: LEAVE WEBSITE DATA AS-IS & SKIP GOOGLE FORM ENTRY ──
    if (matchedWebsiteUser) {
      console.log(`[WEBSITE DUPLICATE DETECTED] Skipped Google Form entry for "${name}" (Matched Website ID: ${matchedWebsiteUser.registrationId}, Reason: ${matchReason})`);
      
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
          registrationId: matchedWebsiteUser.registrationId,
          name: matchedWebsiteUser.name,
          email: matchedWebsiteUser.email,
          whatsapp: matchedWebsiteUser.whatsapp,
          paymentUTR: matchedWebsiteUser.paymentUTR,
          institution: matchedWebsiteUser.institution,
        },
        matchReason: `DUPLICATE_OF_WEBSITE_${matchReason}`,
        status: 'SKIPPED',
        rawPayload: payload,
      });

      return {
        success: true,
        duplicate: true,
        status: 'WEBSITE_DUPLICATE_SKIPPED',
        matchReason: `DUPLICATE_OF_WEBSITE_${matchReason}`,
        registrationId: matchedWebsiteUser.registrationId,
        message: `Duplicate of website registration (${matchReason}). Left website data as-is.`,
      };
    }

    // ── CHECK IF THIS SPECIFIC GOOGLE FORM SUBMISSION HAS ALREADY BEEN ALLOTTED ──
    // Do NOT remove duplicates from Google Form itself, but ensure recurring poller does not re-allot the same row.
    let alreadyAllottedUser = null;
    if (formTimestamp && name) {
      alreadyAllottedUser = await User.findOne({
        source: 'google_form',
        formTimestamp,
        name: new RegExp(`^${name.trim()}$`, 'i'),
      });
    }
    if (!alreadyAllottedUser && screenshotUrl && !screenshotUrl.includes('offline-receipt.png')) {
      alreadyAllottedUser = await User.findOne({
        source: 'google_form',
        paymentScreenshotUrl: screenshotUrl,
        name: new RegExp(`^${name.trim()}$`, 'i'),
      });
    }

    if (alreadyAllottedUser) {
      return {
        success: true,
        duplicate: false,
        alreadyAllotted: true,
        status: 'ALREADY_ALLOTTED',
        registrationId: alreadyAllottedUser.registrationId,
        name: alreadyAllottedUser.name,
        message: `Already allotted with ID ${alreadyAllottedUser.registrationId}`,
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
      formTimestamp: formTimestamp || null,
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
