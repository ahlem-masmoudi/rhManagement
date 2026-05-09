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
  // Current status of the candidate in recruitment pipeline
  status: {
    type: String,
    enum: [
      'nouveau',
      'preselectionne',
      'en_attente_documents',
      'documents_recus',
      'entretien_programme',
      'entretien_realise',
      'validation_finale',
      'offre_envoyee',
      'offre_acceptee',
      'offre_refusee',
      'rejete',
      'abandonne'
    ],
    default: 'nouveau'
  },
  // History of status changes
  statusHistory: [
    {
      id: String,
      previousStatus: String,
      newStatus: String,
      changedBy: String,
      changedAt: Date,
      comment: String,
      emailSent: { type: Boolean, default: false },
      emailSentAt: Date
    }
  ],
  // Tracking token for candidate to follow application
  trackingToken: {
    type: String,
    index: true,
    unique: false
  },
  // Documents uploaded by candidate or RH (store minimal metadata and content for dev)
  documents: [
    {
      id: String,
      name: String,
      type: String,
      content: String, // base64 or text (for demo)
      status: {
        type: String,
        enum: ['en_attente', 'soumis', 'valide', 'rejete', 'signe'],
        default: 'soumis'
      },
      isSigned: { type: Boolean, default: false },
      signedBy: String,
      generatedBy: String,
      relatedDocumentId: String,
      uploadedBy: String,
      uploadedAt: Date,
      signedAt: Date,
      metadata: mongoose.Schema.Types.Mixed
    }
  ],
  recruiterNotes: {
    type: String,
    default: ''
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
