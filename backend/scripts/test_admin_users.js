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
  path: '/api/admin/users',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Users count:', json.users?.length);
      console.log('Access level:', json.accessLevel);
      if (res.statusCode !== 200) console.log('Response body:', json);
    } catch (e) {
      console.log('Raw body:', data.slice(0, 500));
    }
  });
});

req.on('error', console.error);
req.end();
