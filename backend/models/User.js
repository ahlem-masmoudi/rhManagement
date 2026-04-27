const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['recruiter', 'candidate'],
    default: 'candidate'
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
    updatedAt: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },

  // Risk-based authentication (step-up) fields
  knownDevices: {
    type: [
      {
        deviceHash: { type: String, required: true },
        firstSeen: { type: Date, default: Date.now },
        lastSeen: { type: Date, default: Date.now }
      }
    ],
    default: []
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String
  },
  lastLoginUaHash: {
    type: String
  },
  lastLoginDeviceHash: {
    type: String
  },
  riskChallengeNonceHash: {
    type: String,
    select: false
  },
  riskOtpHash: {
    type: String,
    select: false
  },
  riskOtpExpiresAt: {
    type: Date
  },
  riskOtpAttempts: {
    type: Number,
    default: 0
  },
  riskChallengeIssuedAt: {
    type: Date
  },
  riskChallengeContextDeviceHash: {
    type: String
  },
  riskChallengeContextIp: {
    type: String
  },
  riskChallengeContextUaHash: {
    type: String
  },
  resetPasswordTokenHash: {
    type: String,
    select: false
  },
  resetPasswordExpiresAt: {
    type: Date
  },

  // WebAuthn / fingerprint credentials
  webauthnCredentials: {
    type: [
      {
        credentialID:        { type: String, required: true },
        credentialPublicKey: { type: String, required: true },
        counter:             { type: Number, default: 0 },
        transports:          { type: [String], default: [] },
        deviceType:          { type: String },
        backedUp:            { type: Boolean, default: false },
        createdAt:           { type: Date, default: Date.now }
      }
    ],
    default: []
  },
  webauthnChallenge: {
    type: String,
    select: false
  },
  webauthnChallengeExpiresAt: {
    type: Date
  }
});

// Virtual: is account temporarily locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
