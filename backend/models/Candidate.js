const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  school: {
    type: String,
    trim: true
  },
  educationLevel: {
    type: String,
    trim: true
  },
  expectedDegree: {
    type: String,
    trim: true
  },
  expectedGraduation: {
    type: Date
  },
  availability: {
    type: Date
  },
  skills: [{
    type: String,
    trim: true
  }],
  linkedin: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  portfolio: {
    type: String,
    trim: true
  },
  cv: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

candidateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema);
