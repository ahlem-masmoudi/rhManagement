const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rh-management';
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/checkPassword.js <email> <password>');
  process.exit(1);
}

(async function() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.log('User not found for:', email);
    await mongoose.disconnect();
    process.exit(0);
  }
  console.log('User found:', user.email);
  console.log('Stored password field (truncated):', (user.password || '').slice(0, 60) + (user.password && user.password.length > 60 ? '...' : ''));
  const ok = await bcrypt.compare(password, user.password || '');
  console.log('bcrypt.compare result:', ok);
  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error(err.message || err); process.exit(1); });
