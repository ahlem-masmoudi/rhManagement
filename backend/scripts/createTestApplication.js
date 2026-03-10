require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Offer = require('../models/Offer');
const User = require('../models/User');

const createTestApplication = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a candidate
    const candidateUser = await User.findOne({ role: 'candidate' });
    if (!candidateUser) {
      console.log('❌ No candidate user found. Run npm run seed first.');
      process.exit(1);
    }

    const candidate = await Candidate.findOne({ userId: candidateUser._id });
    if (!candidate) {
      console.log('❌ No candidate profile found.');
      process.exit(1);
    }

    // Find or create an offer
    let offer = await Offer.findOne();
    if (!offer) {
      console.log('📝 Creating test offer...');
      const recruiterUser = await User.findOne({ role: 'recruiter' });
      offer = await Offer.create({
        title: 'Développeur Full Stack',
        company: 'Tech Solutions',
        location: 'Paris',
        type: 'stage',
        duration: '6 mois',
        description: 'Nous recherchons un développeur full stack passionné',
        requirements: ['JavaScript', 'Node.js', 'React'],
        skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
        status: 'active',
        createdBy: recruiterUser._id
      });
      console.log('✅ Test offer created');
    }

    // Check if application already exists
    const existingApp = await Application.findOne({
      candidate: candidate._id,
      offer: offer._id
    });

    if (existingApp) {
      console.log('ℹ️  Application already exists:', {
        candidate: `${candidateUser.firstName} ${candidateUser.lastName}`,
        offer: offer.title,
        status: existingApp.status
      });
    } else {
      // Create application
      const application = await Application.create({
        candidate: candidate._id,
        offer: offer._id,
        status: 'nouveau'
      });

      console.log('✅ Test application created:', {
        id: application._id,
        candidate: `${candidateUser.firstName} ${candidateUser.lastName}`,
        offer: offer.title,
        status: application.status,
        appliedAt: application.appliedAt
      });
    }

    // Show all applications
    const allApps = await Application.find()
      .populate({
        path: 'candidate',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate('offer', 'title company');

    console.log('\n📊 All applications in database:', allApps.length);
    allApps.forEach(app => {
      console.log(`  - ${app.candidate?.userId?.firstName || 'Unknown'} ${app.candidate?.userId?.lastName || ''} → ${app.offer?.title || 'Unknown'} (${app.status})`);
    });

    mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestApplication();
