/**
 * One-time script: remove the 3rd application for ahlemmassmoudi8@gmail.com
 * Run from backend/ directory: node scripts/remove-extra-application.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');

async function run() {
  await connectDB();

  const user = await User.findOne({ email: 'ahlemmassmoudi8@gmail.com' }).lean();
  if (!user) { console.error('User not found'); process.exit(1); }

  const candidate = await Candidate.findOne({ userId: user._id }).lean();
  if (!candidate) { console.error('Candidate not found'); process.exit(1); }

  const apps = await Application.find({ candidate: candidate._id }).sort({ createdAt: 1 }).lean();
  console.log(`Found ${apps.length} application(s) for ${user.email}`);
  apps.forEach((a, i) => console.log(`  [${i+1}] offer=${a.offer}  createdAt=${a.createdAt}`));

  if (apps.length <= 2) {
    console.log('Already ≤ 2 applications — nothing to remove.');
    await mongoose.disconnect(); process.exit(0);
  }

  // Remove all beyond the first 2 (sorted oldest first → remove the newest ones)
  const toRemove = apps.slice(2);
  for (const app of toRemove) {
    await Application.deleteOne({ _id: app._id });
    console.log(`✅ Deleted application ${app._id} (offer ${app.offer})`);
  }

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
