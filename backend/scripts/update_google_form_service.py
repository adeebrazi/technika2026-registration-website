with open('z:\\Technika 6.0\\Registration\\backend\\services\\googleFormService.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add formTimestamp extraction
old_extract = '''    const rawInst = getField(payload, [
      'schoolcollegeuniversityname',
      'schoolcollegename',
      'schoolcollegeuniversity',
      'schoolcollege',
      'institution',
      'institutename',
      'collegename',
      'schoolname'
    ], '');
    const institution = rawInst || 'Others';'''

new_extract = '''    const rawInst = getField(payload, [
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

    const formTimestamp = getField(payload, ['timestamp', 'time', 'date', 'submittedat'], '');'''

assert old_extract in content, 'old_extract not found'
content = content.replace(old_extract, new_extract, 1)

# 2. Update deduplication logic to ONLY check against Website registrations, and allow distinct Google Form submissions
old_dedup = '''    // ── 3. TIERED SILENT DEDUPLICATION ──
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
    }'''

new_dedup = '''    // ── 3. DEDUPLICATION ENGINE: ONLY COMPARE GOOGLE FORM AGAINST WEBSITE ──
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
    }'''

assert old_dedup in content, 'old_dedup not found'
content = content.replace(old_dedup, new_dedup, 1)

# 3. Add formTimestamp to new User creation
old_user = '''      source: 'google_form',
    });'''

new_user = '''      source: 'google_form',
      formTimestamp: formTimestamp || null,
    });'''

assert old_user in content, 'old_user not found'
content = content.replace(old_user, new_user, 1)

with open('z:\\Technika 6.0\\Registration\\backend\\services\\googleFormService.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated googleFormService.js successfully!')
