const fs = require('fs');
const path = require('path');

const TARGET_URL = 'http://localhost:5000/api/register';
const TOTAL_REQUESTS = 100;
const CONCURRENCY = 15; // 15 simultaneous concurrent connections
const TRACK_FILE = path.join(__dirname, 'loadtest_100_tracked.json');

const NAMES = [
  'Aarav Sharma', 'Vivaan Patel', 'Aditya Verma', 'Vihaan Gupta', 'Arjun Singh',
  'Sai Reddy', 'Reyansh Kumar', 'Ayaan Joshi', 'Krishna Iyer', 'Ishaan Mehta',
  'Diya Roy', 'Saanvi Nair', 'Aanya Rao', 'Aadhya Das', 'Pari Ghosh',
  'Ananya Sen', 'Myra Chopra', 'Riya Banerjee', 'Avani Kulkarni', 'Sneha Pillai',
  'Rohan Deshmukh', 'Karan Bhatia', 'Manish Tiwari', 'Pooja Pandey', 'Neha Saxena'
];

const INSTITUTIONS = [
  'ARKA JAIN University, Jamshedpur',
  'National Institute of Technology (NIT), Jamshedpur',
  'Birla Institute of Technology (BIT), Mesra',
  'AIIMS Deoghar',
  'Kolhan University, Chaibasa',
  'Karim City College, Jamshedpur',
  'Jamshedpur Co-operative College',
  'R.V.S College of Engineering and Technology'
];

const COURSES = [
  'B.Tech CSE', 'B.Tech Mechanical', 'B.Tech Electrical',
  'BCA', 'MCA', 'BBA', 'MBA', 'B.Sc IT', 'Diploma CSE'
];

const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];
const GENDERS = ['Male', 'Female', 'Other'];

const EVENTS = [
  'TECH_RW', 'TECH_WW', 'TECH_CB', 'TECH_AQ', 'CRE_FF', 
  'CUL_SD', 'TECH_CC', 'TECH_AA', 'TECH_CL', 'CRE_CR'
];

// Helper to pad numbers: 001, 002...
function pad(num, size = 3) {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

// 12-digit UTR generator for loadtest: 888800000001 ...
function getUtr(idx) {
  return `8888${pad(idx, 8)}`;
}

async function runLoadTest() {
  console.log('====================================================');
  console.log(' TECHNIKA 6.0 — 100 REGISTRATIONS LOAD & STRESS TEST');
  console.log('====================================================');
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrency: ${CONCURRENCY} workers`);
  console.log(`Tracking File: ${TRACK_FILE}`);
  console.log('----------------------------------------------------');

  // Load sample image
  const sampleImagePath = path.join(__dirname, '..', '..', 'Dashboard', 'public', 'technika_logo.jpg');
  if (!fs.existsSync(sampleImagePath)) {
    throw new Error(`Sample image not found at ${sampleImagePath}`);
  }
  const imageBuffer = fs.readFileSync(sampleImagePath);

  const results = [];
  const trackedItems = [];
  let completedCount = 0;
  let activeIndex = 0;
  const overallStart = Date.now();

  async function executeSingleRegistration(idx) {
    const paddedIdx = pad(idx, 3);
    const baseName = NAMES[(idx - 1) % NAMES.length];
    const name = `LoadTest ${baseName} ${paddedIdx}`;
    const email = `loadtest.participant${paddedIdx}@gmail.com`;
    const whatsapp = `9198${pad(idx, 8)}`;
    const institution = INSTITUTIONS[(idx - 1) % INSTITUTIONS.length];
    const course = COURSES[(idx - 1) % COURSES.length];
    const semester = SEMESTERS[(idx - 1) % SEMESTERS.length];
    const gender = GENDERS[(idx - 1) % GENDERS.length];
    const age = 18 + (idx % 6);
    const paymentUTR = getUtr(idx);
    const selectedEvent = EVENTS[(idx - 1) % EVENTS.length];

    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('whatsapp', whatsapp);
    form.append('institution', institution);
    form.append('course', course);
    form.append('semester', semester);
    form.append('gender', gender);
    form.append('age', age.toString());
    form.append('password', 'LoadTestPass@123');
    form.append('paymentUTR', paymentUTR);
    form.append('selectedEvents', JSON.stringify([{ slug: selectedEvent, mode: 'auto' }]));
    
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    form.append('paymentScreenshot', blob, `receipt_${paddedIdx}.jpg`);

    const reqStart = Date.now();
    try {
      const res = await fetch(TARGET_URL, {
        method: 'POST',
        body: form
      });
      const durationMs = Date.now() - reqStart;
      const json = await res.json();

      const record = {
        index: idx,
        name,
        email,
        paymentUTR,
        institution,
        course,
        event: selectedEvent,
        status: res.status,
        success: res.ok && json.success,
        durationMs,
        registrationId: json.registrationId || null,
        createdTeams: (json.createdTeams || []).map(t => t.teamId),
        error: !res.ok ? (json.message || 'Unknown error') : null,
        timestamp: new Date().toISOString()
      };

      results.push(record);
      if (record.success) {
        trackedItems.push(record);
      }

      completedCount++;
      const symbol = record.success ? '✔' : '✖';
      console.log(`[${completedCount}/${TOTAL_REQUESTS}] ${symbol} #${paddedIdx} | ${res.status} | ${durationMs}ms | RegID: ${record.registrationId || 'N/A'} | ${name}`);
    } catch (err) {
      const durationMs = Date.now() - reqStart;
      const record = {
        index: idx,
        name,
        email,
        paymentUTR,
        status: 0,
        success: false,
        durationMs,
        registrationId: null,
        createdTeams: [],
        error: err.message,
        timestamp: new Date().toISOString()
      };
      results.push(record);
      completedCount++;
      console.error(`[${completedCount}/${TOTAL_REQUESTS}] ✖ #${paddedIdx} | ERR | ${durationMs}ms | ${err.message}`);
    }
  }

  // Worker loop pulling from queue
  async function worker() {
    while (activeIndex < TOTAL_REQUESTS) {
      activeIndex++;
      const currentIdx = activeIndex;
      await executeSingleRegistration(currentIdx);
    }
  }

  // Spawn CONCURRENCY workers
  console.log(`\n>>> Launching ${CONCURRENCY} concurrent workers now...\n`);
  const workers = Array.from({ length: CONCURRENCY }).map(() => worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - overallStart) / 1000;

  // Persist tracking file
  const trackingSummary = {
    testRunAt: new Date().toISOString(),
    totalDispatched: TOTAL_REQUESTS,
    concurrency: CONCURRENCY,
    totalDurationSeconds: Number(totalTimeSec.toFixed(2)),
    successfulCount: trackedItems.length,
    failedCount: results.filter(r => !r.success).length,
    registrationIds: trackedItems.map(t => t.registrationId).filter(Boolean),
    teamIds: trackedItems.flatMap(t => t.createdTeams).filter(Boolean),
    emails: trackedItems.map(t => t.email),
    items: trackedItems
  };

  fs.writeFileSync(TRACK_FILE, JSON.stringify(trackingSummary, null, 2), 'utf8');
  console.log(`\n✔ Saved 100 tracked registrations to: ${TRACK_FILE}`);

  // Calculate stats
  const latencies = results.map(r => r.durationMs).sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);
  const avg = latencies.length > 0 ? Math.round(sum / latencies.length) : 0;
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (TOTAL_REQUESTS / totalTimeSec).toFixed(2);

  console.log('\n====================================================');
  console.log('              LOAD TEST PERFORMANCE REPORT          ');
  console.log('====================================================');
  console.log(`Total Requests Dispatched : ${TOTAL_REQUESTS}`);
  console.log(`Concurrency Level         : ${CONCURRENCY} parallel requests`);
  console.log(`Successful Registrations  : ${trackedItems.length} (${((trackedItems.length / TOTAL_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`Failed Registrations      : ${results.filter(r => !r.success).length}`);
  console.log(`Total Wall Clock Time     : ${totalTimeSec.toFixed(2)} seconds`);
  console.log(`Throughput                : ${rps} req/sec`);
  console.log('----------------------------------------------------');
  console.log('LATENCY METRICS (Client Round-Trip):');
  console.log(`  Min Latency             : ${min} ms`);
  console.log(`  Avg Latency             : ${avg} ms`);
  console.log(`  Median (P50)            : ${p50} ms`);
  console.log(`  P90 Latency             : ${p90} ms`);
  console.log(`  P95 Latency             : ${p95} ms`);
  console.log(`  Max Latency             : ${max} ms`);
  console.log('====================================================');
  console.log(`All ${trackedItems.length} registrations are safely tracked in:`);
  console.log(`  ${TRACK_FILE}`);
  console.log('To delete all test registrations, run:');
  console.log('  node delete_loadtest.js');
  console.log('====================================================\n');
}

runLoadTest().catch(err => {
  console.error('Fatal load test runner error:', err);
  process.exit(1);
});
