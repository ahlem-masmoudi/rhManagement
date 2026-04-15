const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const User = require('../models/User');
    const emails = ['rh@example.com', 'admin@rh.com'];

    for (const e of emails) {
      const r = await User.updateOne({ email: e }, { $set: { failedLoginAttempts: 0, lockUntil: null } });
      console.log('updated', e, 'matched', r.matchedCount, 'modified', r.modifiedCount);
    }

    await mongoose.disconnect();
    console.log('done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
