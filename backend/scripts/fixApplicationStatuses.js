require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('../models/Application');

const fixOldApplications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Map old status to new status
    const statusMap = {
      'pending': 'nouveau',
      'reviewed': 'preselectionne',
      'interview': 'entretien_programme',
      'accepted': 'offre_acceptee',
      'rejected': 'rejete'
    };

    const oldStatuses = ['pending', 'reviewed', 'interview', 'accepted', 'rejected'];
    const applications = await Application.find({ status: { $in: oldStatuses } });

    console.log(`Found ${applications.length} applications with old status values`);

    for (const app of applications) {
      const oldStatus = app.status;
      const newStatus = statusMap[oldStatus] || 'nouveau';
      app.status = newStatus;
      await app.save({ validateBeforeSave: false });
      console.log(`✅ Updated application ${app._id}: ${oldStatus} → ${newStatus}`);
    }

    // Show all applications
    const allApps = await Application.find();

    console.log('\n📊 All applications after update:', allApps.length);
    allApps.forEach(app => {
      console.log(`  - Application ${app._id}: status=${app.status}`);
    });

    mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

fixOldApplications();
