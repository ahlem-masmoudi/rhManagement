const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  getApplicationsByOffer,
  getMyApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const { scoreApplication } = require('../controllers/scoreController');

// Candidate routes
router.get('/my', protect, authorize('candidate'), getMyApplications);

// Recruiter routes
router.get('/', protect, authorize('recruiter'), getAllApplications);
router.get('/offer/:offerId', protect, authorize('recruiter'), getApplicationsByOffer);
router.put('/:applicationId/status', protect, authorize('recruiter'), updateApplicationStatus);

// Score an application (upload resume + job text) and persist matching result
router.post('/:applicationId/score', protect, authorize('recruiter'), scoreApplication);

module.exports = router;
