const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAllCandidates,
  getCandidate,
  getCandidateByTrackingToken,
  bulkUpdateStatus,
  generateTrackingToken,
  uploadDocument,
  downloadDocument,
  downloadDocumentByTrackingToken,
  uploadDocumentByTrackingToken,
  generateSignedInternshipRequest,
  generateAssignmentLetter,
  updateCandidateNotes
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');

// Candidate routes (for authenticated candidates)
router.get('/profile', protect, authorize('candidate'), getProfile);
router.put('/profile', protect, authorize('candidate'), updateProfile);

// Public tracking routes (no auth — token-based)
router.get('/tracking/:token', getCandidateByTrackingToken);
router.post('/tracking/:token/documents', uploadDocumentByTrackingToken);
router.get('/tracking/:token/documents/:docId/download', downloadDocumentByTrackingToken);

// Recruiter routes (for viewing candidates)
router.get('/', protect, authorize('recruiter', 'rh_candidatures'), getAllCandidates);
router.get('/:id', protect, authorize('recruiter', 'rh_candidatures'), getCandidate);

// Bulk update statuses (recruiter)
router.post('/bulk-status', protect, authorize('recruiter', 'rh_candidatures'), bulkUpdateStatus);

// Generate tracking token for candidate
router.post('/:id/generate-tracking', protect, authorize('recruiter', 'rh_candidatures'), generateTrackingToken);

// Upload document for candidate (candidate or recruiter)
router.post('/:id/documents', protect, uploadDocument);
router.post('/:id/documents/:docId/sign-request', protect, authorize('recruiter', 'admin', 'rh_candidatures'), generateSignedInternshipRequest);
router.post('/:id/documents/generate-assignment-letter', protect, authorize('recruiter', 'rh_candidatures'), generateAssignmentLetter);

// Update recruiter notes for a candidate
router.put('/:id/notes', protect, authorize('recruiter', 'rh_candidatures'), updateCandidateNotes);

// Download document
router.get('/:id/documents/:docId/download', protect, downloadDocument);

module.exports = router;
