const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  getApplicationsByOffer,
  getMyApplications,
  updateApplicationStatus,
  getBookedSlots,
  scheduleInterview,
  evaluateApplication
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const { scoreApplication } = require('../controllers/scoreController');

// Candidate routes
router.get('/my', protect, authorize('candidate'), getMyApplications);

// Recruiter routes
router.get('/', protect, authorize('recruiter', 'admin'), getAllApplications);
router.get('/booked-slots', protect, authorize('recruiter', 'admin'), getBookedSlots);
router.get('/offer/:offerId', protect, authorize('recruiter', 'admin'), getApplicationsByOffer);
router.put('/:applicationId/status', protect, authorize('recruiter', 'admin'), updateApplicationStatus);
router.patch('/:applicationId/interview', protect, authorize('recruiter', 'admin'), scheduleInterview);
router.patch('/:applicationId/evaluate', protect, authorize('recruiter', 'admin'), evaluateApplication);

// Score an application (upload resume + job text) and persist matching result
router.post('/:applicationId/score', protect, authorize('recruiter', 'admin'), scoreApplication);

module.exports = router;
