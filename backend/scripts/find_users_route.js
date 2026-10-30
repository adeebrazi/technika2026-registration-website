const fs = require('fs');
const content = fs.readFileSync('z:/Technika 6.0/Registration/backend/routes/adminRoutes.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes("router.get('/users'")) {
    console.log((i+1) + ': ' + l);
  }
});
