const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['recruiter', 'candidate'], default: 'candidate' },
  profileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Candidate Schema
const candidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: String,
  location: String,
  school: String,
  educationLevel: String,
  expectedDegree: String,
  expectedGraduation: Date,
  availability: Date,
  skills: [String],
  linkedin: String,
  github: String,
  portfolio: String,
  applications: [],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Candidate = mongoose.model('Candidate', candidateSchema);

// Test users data
const testUsers = [
  {
    email: 'admin@rh.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'RH',
    role: 'recruiter',
    profileComplete: true
  },
  {
    email: 'rh@example.com',
    password: 'password',
    firstName: 'Marie',
    lastName: 'Dupont',
    role: 'recruiter',
    profileComplete: true
  },
  {
    email: 'candidate@example.com',
    password: 'candidate123',
    firstName: 'Sophie',
    lastName: 'Martin',
    role: 'candidate',
    profileComplete: true,
    candidateProfile: {
      phone: '+33 6 12 34 56 78',
      location: 'Paris, France',
      school: 'Université Paris-Saclay',
      educationLevel: 'Master',
      expectedDegree: 'Master en Informatique',
      expectedGraduation: new Date('2026-06-30'),
      availability: new Date('2026-07-01'),
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript'],
      linkedin: 'https://linkedin.com/in/sophie-martin',
      github: 'https://github.com/sophiemartin'
    }
  },
  {
    email: 'newcandidate@example.com',
    password: 'new123',
    firstName: 'Jean',
    lastName: 'Dubois',
    role: 'candidate',
    profileComplete: false
  }
];

// Create test users
const createTestUsers = async () => {
  try {
    await connectDB();

    console.log('🚀 Creating test users...\n');

    let created = 0;
    let skipped = 0;

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists - skipping`);
        skipped++;
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create user
      const user = await User.create({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        profileComplete: userData.profileComplete
      });

      console.log(`✅ Created user: ${user.email} (${user.role})`);

      // Create candidate profile if role is candidate
      if (userData.role === 'candidate') {
        const candidateData = userData.candidateProfile || {};
        await Candidate.create({
          userId: user._id,
          ...candidateData
        });
        console.log(`   📝 Created candidate profile for ${user.email}`);
      }

      created++;
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ Created: ${created} users`);
    console.log(`⚠️  Skipped: ${skipped} users (already exist)`);
    console.log('═══════════════════════════════════════\n');

    console.log('📋 Test Accounts:\n');
    console.log('👨‍💼 RH/Admin Accounts:');
    console.log('   • admin@rh.com / admin123');
    console.log('   • rh@example.com / password\n');
    console.log('👤 Candidate Accounts:');
    console.log('   • candidate@example.com / candidate123 (complete profile)');
    console.log('   • newcandidate@example.com / new123 (incomplete profile)\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    process.exit(1);
  }
};

// Run script
createTestUsers();
