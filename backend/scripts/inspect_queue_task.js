const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../config/db');

async function checkQueue() {
  await connectDB();
  const db = mongoose.connection.db;

  const tasks = await db.collection('sheetsqueues').find({ registrationId: 'JF26G5' }).toArray();
  console.log('SheetsQueue tasks for JF26G5 (Anwesha Ghosh):', tasks);

  const jbTasks = await db.collection('sheetsqueues').find({ registrationId: 'JBOU52' }).toArray();
  console.log('SheetsQueue tasks for JBOU52 (Jyoti Bhalekar):', jbTasks);

  await mongoose.disconnect();
}

checkQueue().catch(console.error);
