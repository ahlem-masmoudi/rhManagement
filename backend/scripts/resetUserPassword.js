const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const run = async () => {
  const [, , emailArg, passwordArg] = process.argv;

  if (!emailArg || !passwordArg) {
    console.log('Usage: node scripts/resetUserPassword.js <email> <newPassword>');
    process.exit(1);
  }

  const email = String(emailArg).trim().toLowerCase();
  const newPassword = String(passwordArg);

  await connectDB();

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(2);
  }

  // Assign plaintext newPassword and let the User model pre-save hook hash it
  user.password = newPassword;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;

  // Clear any pending risk challenge
  user.riskOtpHash = undefined;
  user.riskOtpExpiresAt = undefined;
  user.riskOtpAttempts = 0;
  user.riskChallengeNonceHash = undefined;
  user.riskChallengeIssuedAt = undefined;
  user.riskChallengeContextDeviceHash = undefined;
  user.riskChallengeContextIp = undefined;
  user.riskChallengeContextUaHash = undefined;

  await user.save();

  console.log(`✅ Password updated for ${email}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
