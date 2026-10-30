const fs = require('fs');
const s = fs.readFileSync('z:/Technika 6.0/Registration/backend/services/sheetsService.js', 'utf8');
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes('reconcile') || l.includes('queueRegistrationSync') || l.includes('queueParticipantSync') || l.includes('startQueueWorker')) {
    console.log(lines.slice(Math.max(0, i-2), i+15).join('\n'));
    console.log('---');
  }
});
