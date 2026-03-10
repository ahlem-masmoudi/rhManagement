require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getRecruiterToken = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a recruiter
    const recruiter = await User.findOne({ role: 'recruiter' });
    if (!recruiter) {
      console.log('❌ No recruiter found');
      process.exit(1);
    }

    // Generate token
    const token = jwt.sign(
      { id: recruiter._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    console.log('\n📧 Recruiter:', recruiter.email);
    console.log('\n🔑 Token (paste in localStorage as "authToken"):');
    console.log(token);
    console.log('\n📝 Test command:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/applications`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

getRecruiterToken();
