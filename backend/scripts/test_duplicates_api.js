const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });

const payload = {
  email: 'coordinator@technika.com',
  role: 'coordinator',
  name: 'Administrator',
  designation: 'Coordinator',
  isAdmin: true
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/google-form/duplicates',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('/api/google-form/duplicates status:', res.statusCode);
    console.log(data.slice(0, 200));
  });
});

req.on('error', console.error);
req.end();
