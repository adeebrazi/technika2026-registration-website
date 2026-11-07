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
const getCanonicalInstitution = (raw, otherRaw = '', email = '') => {
  let str = (raw || '').trim();
  const otherStr = (otherRaw || '').trim();
  if (otherStr && (str.toLowerCase().includes('other') || !str)) {
    str = otherStr;
  }
  if (!str) return 'OTHERS';
  const lower = str.toLowerCase();

  // 1. ARKA JAIN UNIVERSITY
  if (lower.includes('arka') || lower.includes('jain') || lower === 'aju' || lower.includes('law department')) {
    return 'ARKA JAIN UNIVERSITY';
  }

  // 2. RAMAKRISHNA MISSION (Must be matched BEFORE Krishna!)
  if (lower.includes('ramakrishna') || lower.includes('rama krishna') || lower.includes('rkm')) {
    if (lower.includes('lady indra')) {
      return 'RAMAKRISHNA MISSION LADY INDRA SINGH ENGLISH SCHOOL';
    }
    return 'RAMAKRISHNA MISSION ENGLISH SCHOOL';
  }

  // 3. SRI KRISHNA PUBLIC SCHOOL
  if (lower.includes('sri krishna') || lower.includes('shri krishna') || (lower.includes('krishna') && !lower.includes('rama') && !lower.includes('ravishankar'))) {
    return 'SRI KRISHNA PUBLIC SCHOOL';
  }

  // 4. Other approved & participating institutions
  if (lower.includes('ravishankar') || lower.includes('ravi shankar')) {
    return 'SRI SRI RAVISHANKAR VIDYA MANDIR, GHATSHILA';
  }
  if (lower.includes('women') && (lower.includes('poly') || lower.includes('poli'))) {
    return "WOMEN'S POLYTECHNIC, GAMHARIA";
  }
  if (lower.includes('chandil')) return 'CHANDIL POLYTECHNIC';
  if (lower.includes('icfai')) return 'THE ICFAI UNIVERSITY, JHARKHAND, RANCHI';
  if (lower.includes('karim')) return 'KARIM CITY COLLEGE - SAKCHI';
  if (lower.includes('church school')) return 'CHURCH SCHOOL BELDIH';
  if (lower.includes('cm school') || lower.includes('burmamines') || lower.includes('bpm')) return 'BPM +2 HIGH SCHOOL, BURMAMINES';
  if (lower.includes('d.a.v') || lower.includes('dav')) return 'DAV PUBLIC SCHOOL, ADITYAPUR';
  if (lower.includes('b.a.') || lower.includes('b.a college')) return 'B.A. COLLEGE OF ENGINEERING AND TECHNOLOGY';
  if (lower.includes('tata steel technical') || lower.includes('tsti')) return 'TATA STEEL TECHNICAL INSTITUTE';
  if (lower.includes('maryland')) return 'MARYLAND INSTITUTE OF TECHNOLOGY & MANAGEMENT';
  if (lower.includes('dbms career')) return 'DBMS CAREER ACADEMY';
  if (lower.includes('dbms')) return 'DBMS ENGLISH SCHOOL';
  if (lower.includes('polytechnic') && lower.includes('adityapur')) return 'GOVERNMENT POLYTECHNIC, ADITYAPUR';
  if (lower.includes('govind')) return 'GOVIND VIDYALAYA, TAMULIA';
  if (lower.includes('gulmohar')) return 'GULMOHAR HIGH SCHOOL';
  if (lower.includes('danish') || lower.includes('idtr')) return 'INDO DANISH TOOL ROOM, JAMSHEDPUR';
  if (lower.includes('nit') || lower.includes('national institute of technology')) return 'NATIONAL INSTITUTE OF TECHNOLOGY (NIT), JAMSHEDPUR';
  if (lower.includes('netaji') || lower.includes('nsu')) return 'NETAJI SUBHAS UNIVERSITY, JAMSHEDPUR';
  if (lower.includes('srinath public')) return 'SRINATH PUBLIC SCHOOL, JAMSHEDPUR';
  if (lower.includes('srinath university') || lower.includes('srinath')) return 'SRINATH UNIVERSITY';
  if (lower.includes('central university of jharkhand') || lower.includes('cuj')) return 'CENTRAL UNIVERSITY OF JHARKHAND, RANCHI';
  if (lower.includes('al-kabir') || lower.includes('alkabir')) return 'AL-KABIR POLYTECHNIC';
  if (lower.includes('al-karim') || lower.includes('alkarim')) return 'AL-KARIM UNIVERSITY';
  if (lower.includes('atomic')) return 'ATOMIC ENERGY CENTRAL SCHOOL';
  if (lower.includes('amity') && lower.includes('noida')) return 'AMITY UNIVERSITY NOIDA';
  if (lower.includes('amity')) return 'AMITY UNIVERSITY PATNA';
  if ((lower.includes('jusco') && lower.includes('south park')) || (lower === 'school' && (email || '').toLowerCase().includes('yeshsharma'))) return 'JUSCO SCHOOL SOUTH PARK';
  if (lower.includes('jusco')) return 'JUSCO SCHOOL KADMA';
  if (lower.includes('gitilata') || lower.includes('potka')) return 'HIGH SCHOOL GITILATA POTKA';
  if (lower.includes('snm') || lower.includes('urmal') || lower.includes('chouka')) return 'SNM HIGH SCHOOL, URMAL, CHOUKA';
  if (lower.includes('palli mangal') || lower.includes('pallimangal')) return 'PALLI MANGAL HIGH SCHOOL';
  if (lower.includes('r. d. tata') || lower.includes('r.d. tata') || lower.includes('rd tata')) return 'R. D. TATA TECHNICAL EDUCATION CENTRE, GOLMURI';
  if (lower.includes('rvs')) return 'RVS COLLEGE OF ENGINEERING AND TECHNOLOGY, JAMSHEDPUR';
  if (lower.includes('workers college')) return 'WORKERS COLLEGE JAMSHEDPUR';
  if (lower.includes('sri ram') || lower.includes('shri ram')) return 'SRI RAM ENGLISH HIGH SCHOOL';
  if (lower.includes('chinmaya')) return 'VIDYA BHARATI CHINMAYA VIDYALAYA';
  if (lower.includes('lal bahadur') || lower.includes('lbsm')) return 'LAL BAHADUR SHASTRI MEMORIAL COLLEGE';
  if (lower.includes('polytechnic') && lower.includes('ranchi')) return 'GOVERNMENT POLYTECHNIC, RANCHI';
  if (lower.includes('dayanand')) return 'DAYANAND PUBLIC SCHOOL';
  if (lower.includes('carmel')) return 'CARMEL JUNIOR COLLEGE';
  if (lower.includes('baldwin')) return 'BALDWIN FARM AREA HIGH SCHOOL';
  if (lower.includes('tata workers')) return "TATA WORKERS' UNION HIGH SCHOOL, KADMA";
  if (lower.includes('kerala public') || lower.includes('kps')) return 'KERALA PUBLIC SCHOOL (KPS), KADMA';
  if (lower.includes('rajendra vidyalaya')) return 'RAJENDRA VIDYALAYA';
  if (lower.includes('co-operative') || lower.includes('cooperative')) return 'JAMSHEDPUR CO-OPERATIVE COLLEGE';
  if (lower.includes('kerala samajam') || lower.includes('ksms')) return 'KERALA SAMAJAM MODEL SCHOOL';
  if (lower.includes('xavier')) return "XAVIER'S SCHOOL, GAMHARIA";
  if (lower.includes('navyansh') || lower.includes('nstc')) return 'NAVYANSH SKILL TRAINING CENTRE (NSTC)';
  if (lower.includes('makaut') || lower.includes('maulana abul kalam')) return 'MAULANA ABUL KALAM AZAD UNIVERSITY OF TECHNOLOGY, WEST BENGAL';
  if (lower.includes('kiit') || lower.includes('kalinga')) return 'KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY (KIIT)';
  if (lower.includes('aiims')) return 'AIIMS BHOPAL';

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
const processGoogleFormSubmission = async (payload, cache = null) => {
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
    const rawOtherInst = getField(payload, [
      'enteryourinstitutenameonlyifchoosedothers',
      'choosedothers',
      'otherinstitute',
      'otherinstitution',
      'otherspecify',
      'other'
    ], '');
    const institution = getCanonicalInstitution(rawInst, rawOtherInst, rawEmail);

    const formTimestamp = getField(payload, ['timestamp', 'time', 'date', 'submittedat'], '');

    // Current Education Status (e.g. SCHOOL, COLLEGE, DIPLOMA, B.TECH)
    let rawCourse = getField(payload, [
      'currenteducationstatus',
      'educationstatus',
      'course',
      'stream',
      'category'
    ], '').trim();

    if (!rawCourse || rawCourse.toLowerCase() === 'school student' || rawCourse.toLowerCase() === 'school / college student') {
      const instLower = (institution || '').toLowerCase();
      if (instLower.includes('polytechnic') || instLower.includes('poly')) {
        rawCourse = 'POLYTECHNIC / DIPLOMA';
      } else if (instLower.includes('school') || instLower.includes('vidyalaya') || instLower.includes('academy')) {
        rawCourse = 'SCHOOL';
      } else if (instLower.includes('university') || instLower.includes('college') || instLower.includes('institute')) {
        rawCourse = 'COLLEGE / UNIVERSITY';
      } else {
        rawCourse = '';
      }
    }
    const course = rawCourse;

    // Semester / Standard (e.g. Class 8, Class 9, Class 11, Class 12, Sem 3)
    let rawSem = getField(payload, [
      'semesterstandard',
      'semester',
      'standard',
      'class',
      'grade'
    ], '').trim();
    if (rawSem.toUpperCase() === 'N/A') rawSem = '';
    const semester = rawSem || (course === 'SCHOOL' ? 'Student' : 'General');

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

    // ── 3. DEDUPLICATION ENGINE: DROPPED (ALL GOOGLE FORM SUBMISSIONS ACCEPTED) ──
    // All Google Form entries are accepted regardless of website registrations ("Duplicates will work").

    // ── CHECK IF THIS SPECIFIC GOOGLE FORM SUBMISSION HAS ALREADY BEEN ALLOTTED ──
    // Do NOT remove duplicates from Google Form itself, but ensure recurring poller does not re-allot the same row.
    let alreadyAllottedUser = null;
    const cleanFormTimestamp = (formTimestamp || '').trim();
    const cleanName = (name || '').trim().toLowerCase();
    const cleanScreenshot = (screenshotUrl || '').trim();

    if (cache && cache.existingUser) {
      alreadyAllottedUser = cache.existingUser;
    } else if (cache) {
      if (cleanFormTimestamp && cleanName) {
        const key = `${cleanFormTimestamp}:::${cleanName}`;
        if (cache.usersByKey && cache.usersByKey.has(key)) {
          alreadyAllottedUser = cache.usersByKey.get(key);
        } else if (cache.existingKeySet && cache.existingKeySet.has(key)) {
          alreadyAllottedUser = { registrationId: 'EXISTING', name };
        }
      }
      if (!alreadyAllottedUser && cleanFormTimestamp) {
        if (cache.usersByTimestamp && cache.usersByTimestamp.has(cleanFormTimestamp)) {
          alreadyAllottedUser = cache.usersByTimestamp.get(cleanFormTimestamp);
        }
      }
      if (!alreadyAllottedUser && cleanScreenshot && !cleanScreenshot.includes('offline-receipt.png') && cleanName) {
        const sKey = `${cleanScreenshot}:::${cleanName}`;
        if (cache.usersByScreenshot && cache.usersByScreenshot.has(sKey)) {
          alreadyAllottedUser = cache.usersByScreenshot.get(sKey);
        } else if (cache.existingScreenshotSet && cache.existingScreenshotSet.has(sKey)) {
          alreadyAllottedUser = { registrationId: 'EXISTING', name };
        }
      }
    } else {
      if (formTimestamp && name) {
        alreadyAllottedUser = await User.findOne({
          source: 'google_form',
          formTimestamp,
          name: new RegExp(`^${name.trim()}$`, 'i'),
        });
      }
      if (!alreadyAllottedUser && formTimestamp) {
        alreadyAllottedUser = await User.findOne({
          source: 'google_form',
          formTimestamp,
        });
      }
      if (!alreadyAllottedUser && screenshotUrl && !screenshotUrl.includes('offline-receipt.png')) {
        alreadyAllottedUser = await User.findOne({
          source: 'google_form',
          paymentScreenshotUrl: screenshotUrl,
          name: new RegExp(`^${name.trim()}$`, 'i'),
        });
      }
    }

    if (alreadyAllottedUser) {
      let targetUser = alreadyAllottedUser._id ? alreadyAllottedUser : null;
      if (!targetUser && alreadyAllottedUser.registrationId && alreadyAllottedUser.registrationId !== 'EXISTING') {
        targetUser = await User.findOne({ registrationId: alreadyAllottedUser.registrationId });
      }
      if (!targetUser && cleanFormTimestamp && cleanName) {
        targetUser = await User.findOne({
          source: 'google_form',
          formTimestamp,
          name: new RegExp(`^${name.trim()}$`, 'i'),
        });
      }
      if (!targetUser && cleanFormTimestamp) {
        targetUser = await User.findOne({
          source: 'google_form',
          formTimestamp,
        });
      }

      if (targetUser) {
        const instLower = (institution || '').toLowerCase();
        const isAju = instLower.includes('arka') || instLower.includes('jain') || instLower === 'aju';
        const crsLower = `${course || ''} ${semester || ''}`.toLowerCase();
        const isBtechBcaDiploma =
          crsLower.includes('b.tech') ||
          crsLower.includes('btech') ||
          crsLower.includes('b.e.') ||
          crsLower.includes('bca') ||
          crsLower.includes('diploma') ||
          crsLower.includes('polytechnic');
        const isAjuStudentExempt = isAju && isBtechBcaDiploma;
        const resolvedExpectedAmount = isAjuStudentExempt ? 600 : 100;

        const effectiveScreenshot = screenshotUrl || targetUser.paymentScreenshotUrl || '';
        const hasRealScreenshot = Boolean(
          effectiveScreenshot &&
          typeof effectiveScreenshot === 'string' &&
          effectiveScreenshot.trim() &&
          !effectiveScreenshot.includes('offline-receipt.png') &&
          (effectiveScreenshot.startsWith('http://') || effectiveScreenshot.startsWith('https://'))
        );

        const updateFields = {};
        if (institution && institution !== targetUser.institution) {
          updateFields.institution = institution;
        }
        if (name && name !== targetUser.name) {
          updateFields.name = name;
        }
        if (course && course !== targetUser.course) {
          updateFields.course = course;
        }
        if (semester && semester !== targetUser.semester) {
          updateFields.semester = semester;
        }
        if (gender && gender !== targetUser.gender && gender !== 'Other') {
          updateFields.gender = gender;
        }
        if (phone && phone !== targetUser.whatsapp && phone !== 'N/A' && targetUser.whatsapp !== 'N/A') {
          const cleanP1 = phone.replace(/[^0-9]/g, '');
          const cleanP2 = (targetUser.whatsapp || '').replace(/[^0-9]/g, '');
          if (cleanP1 && cleanP2 && cleanP1 !== cleanP2) {
            updateFields.whatsapp = phone;
          }
        }
        if (rawEmail && rawEmail !== (targetUser.email || '').toLowerCase()) {
          updateFields.email = rawEmail;
        }
        if (screenshotUrl && screenshotUrl !== targetUser.paymentScreenshotUrl) {
          updateFields.paymentScreenshotUrl = screenshotUrl;
        }
        if (rawUtr && rawUtr.trim() && rawUtr.trim() !== targetUser.utrEnteredManually) {
          updateFields.utrEnteredManually = rawUtr.trim();
          const cleanUtr = rawUtr.trim();
          const isPlaceholder = ['done', 'yes', 'ok', 'n/a', 'na', 'paid', 'none', 'nil', 'no', 'completed'].includes(cleanUtr.toLowerCase());
          if (!isPlaceholder && (!targetUser.paymentUTR || targetUser.paymentUTR.startsWith('GFORM-'))) {
            const colliding = await User.exists({ paymentUTR: cleanUtr, _id: { $ne: targetUser._id } });
            if (!colliding) {
              updateFields.paymentUTR = cleanUtr;
            }
          }
        }
        if (resolvedExpectedAmount !== targetUser.expectedAmount) {
          updateFields.expectedAmount = resolvedExpectedAmount;
          updateFields.isAjuExempt = isAjuStudentExempt;
        }
        const expectedStatus = hasRealScreenshot ? 'SUCCESS' : 'PENDING';
        const expectedVerifiedAmount = hasRealScreenshot ? resolvedExpectedAmount : 0;
        if (targetUser.verificationStatus !== expectedStatus) {
          updateFields.verificationStatus = expectedStatus;
        }
        if (targetUser.verifiedAmount !== expectedVerifiedAmount) {
          updateFields.verifiedAmount = expectedVerifiedAmount;
        }

        if (Object.keys(updateFields).length > 0) {
          await User.updateOne({ _id: targetUser._id }, { $set: updateFields });
          console.log(`[GOOGLE FORM SYNC] Reconciled existing user ${targetUser.registrationId} (${targetUser.name}):`, Object.keys(updateFields).join(', '));
          return {
            success: true,
            updated: true,
            registrationId: targetUser.registrationId,
            name: targetUser.name,
            changes: updateFields,
          };
        }
      }

      return {
        success: true,
        duplicate: false,
        alreadyAllotted: true,
        status: 'ALREADY_ALLOTTED',
        registrationId: (targetUser || alreadyAllottedUser).registrationId,
        name: (targetUser || alreadyAllottedUser).name,
        message: `Already allotted with ID ${(targetUser || alreadyAllottedUser).registrationId}`,
      };
    }

    // ── 4. RESOLVE EVENTS FOR NEW UNIQUE PARTICIPANT ──
    let allEvents = (cache && cache.allEvents) ? cache.allEvents : null;
    if (!allEvents) {
      allEvents = await Event.find({ isActive: true });
      if (cache) cache.allEvents = allEvents;
    }
    const resolvedEvents = await resolveEvents(eventsInput, allEvents);

    // ── 5. HANDLE BATCH / SIBLING UTR COLLISION ──
    const baseUtr = (rawUtr || '').trim() || `GFORM-${Date.now()}`;
    let finalUtr = baseUtr;
    let isColliding = await User.exists({
      $or: [{ paymentUTR: finalUtr }, { utrEnteredManually: finalUtr }]
    });

    if (isColliding) {
      let attempts = 0;
      while (isColliding && attempts < 100) {
        attempts++;
        finalUtr = `${baseUtr}-S${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
        isColliding = await User.exists({
          $or: [{ paymentUTR: finalUtr }, { utrEnteredManually: finalUtr }]
        });
      }
    }

    // ── 6. CREATE USER AND REGISTRATIONS ──
    const registrationId = await generateRegistrationId();
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const submissionKey = cleanFormTimestamp && cleanName ? `${cleanFormTimestamp}:::${cleanName}` : undefined;

    // Check if student belongs to ARKA JAIN University and BTech / BCA / Diploma
    const instLower = (institution || '').toLowerCase();
    const isAju = instLower.includes('arka') || instLower.includes('jain') || instLower === 'aju';
    const crsLower = `${course || ''} ${semester || ''}`.toLowerCase();
    const isBtechBcaDiploma =
      crsLower.includes('b.tech') ||
      crsLower.includes('btech') ||
      crsLower.includes('b.e.') ||
      crsLower.includes('bca') ||
      crsLower.includes('diploma') ||
      crsLower.includes('polytechnic');
    const isAjuStudentExempt = isAju && isBtechBcaDiploma;
    const resolvedExpectedAmount = isAjuStudentExempt ? 600 : 100;

    const hasRealScreenshot = Boolean(
      screenshotUrl &&
      typeof screenshotUrl === 'string' &&
      screenshotUrl.trim() &&
      !screenshotUrl.includes('offline-receipt.png') &&
      (screenshotUrl.startsWith('http://') || screenshotUrl.startsWith('https://'))
    );

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
      utrEnteredManually: (rawUtr || '').trim() || finalUtr,
      paymentScreenshotUrl: screenshotUrl || '',
      expectedAmount: resolvedExpectedAmount,
      verifiedAmount: hasRealScreenshot ? resolvedExpectedAmount : 0,
      verificationStatus: hasRealScreenshot ? 'SUCCESS' : 'PENDING',
      isAjuExempt: isAjuStudentExempt,
      source: 'google_form',
      formTimestamp: formTimestamp || null,
      formSubmissionKey: submissionKey,
    });

    try {
      await newUser.save();
    } catch (saveErr) {
      if (saveErr.code === 11000 && (saveErr.keyPattern?.formSubmissionKey || saveErr.message?.includes('formSubmissionKey'))) {
        console.log(`[ATOMIC DEDUPLICATION] Duplicate submission key rejected by DB index: ${submissionKey}`);
        return {
          success: true,
          duplicate: false,
          alreadyAllotted: true,
          status: 'ALREADY_ALLOTTED',
          registrationId: 'EXISTING',
          name,
          message: `Already allotted atomically`,
        };
      }
      throw saveErr;
    }

    if (cache) {
      if (cleanFormTimestamp && cleanName && cache.existingKeySet) {
        cache.existingKeySet.add(`${cleanFormTimestamp}:::${cleanName}`);
      }
      if (cleanScreenshot && !cleanScreenshot.includes('offline-receipt.png') && cleanName && cache.existingScreenshotSet) {
        cache.existingScreenshotSet.add(`${cleanScreenshot}:::${cleanName}`);
      }
    }

    // Create event registrations
    for (const ev of resolvedEvents) {
      await Registration.create({
        registrationId,
        eventId: ev.eventId,
        registrationType: ev.teamAllowed ? 'TEAM' : 'INDIVIDUAL',
        status: 'CONFIRMED',
      });
    }

    // Synchronous write to Google_Form_Allotted sheet was removed to eliminate
    // 50-second API lags and Vercel serverless function timeouts.
    // Dashboard connects directly to MongoDB (synced from OG Form Sheet).

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
