const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAllCandidates,
  getCandidate
} = require('../controllers/candidateController');
const { bulkUpdateStatus, generateTrackingToken, uploadDocument, downloadDocument } = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');

// Candidate routes (for authenticated candidates)
router.get('/profile', protect, authorize('candidate'), getProfile);
router.put('/profile', protect, authorize('candidate'), updateProfile);

// Recruiter routes (for viewing candidates)
router.get('/', protect, authorize('recruiter'), getAllCandidates);
router.get('/:id', protect, authorize('recruiter'), getCandidate);

// Bulk update statuses (recruiter)
router.post('/bulk-status', protect, authorize('recruiter'), bulkUpdateStatus);

// Generate tracking token for candidate
router.post('/:id/generate-tracking', protect, authorize('recruiter'), generateTrackingToken);

// Upload document for candidate (candidate or recruiter)
router.post('/:id/documents', protect, uploadDocument);

// Download document
router.get('/:id/documents/:docId/download', protect, downloadDocument);

module.exports = router;
