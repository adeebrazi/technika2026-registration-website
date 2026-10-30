const path = require('path');
require('dotenv').config({ path: 'z:/Technika 6.0/Registration/backend/.env' });
const connectDB = require('../config/db');
const RolePermission = require('../models/RolePermission');

async function checkPerms() {
  await connectDB();
  const perms = await RolePermission.find().lean();
  console.log('RolePermissions in DB:', JSON.stringify(perms, null, 2));
  process.exit(0);
}

checkPerms().catch(console.error);
