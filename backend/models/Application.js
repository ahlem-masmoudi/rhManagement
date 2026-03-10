const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Please add a candidate ID']
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: [true, 'Please add an offer ID']
  },
  status: {
    type: String,
    enum: [
      'nouveau',
      'preselectionne',
      'en_attente_documents',
      'documents_recus',
      'entretien_programme',
      'entretien_realise',
      'test_technique',
      'validation_finale',
      'offre_envoyee',
      'offre_acceptee',
      'offre_refusee',
      'rejete',
      'abandonne'
    ],
    default: 'nouveau'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  resumeUrl: {
    type: String
  },
  coverLetter: {
    type: String
  }
}, {
  timestamps: true
});

// Prevent duplicate applications
ApplicationSchema.index({ candidate: 1, offer: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
