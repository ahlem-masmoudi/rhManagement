const express = require('express');
const router = express.Router();
const {
  getAllApplications,
  getApplicationsByOffer,
  getMyApplications,
  updateApplicationStatus,
  getBookedSlots,
  scheduleInterview,
  evaluateApplication,
  deleteApplication
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const { scoreApplication } = require('../controllers/scoreController');

// Candidate routes
router.get('/my', protect, authorize('candidate'), getMyApplications);

// Recruiter routes
router.get('/', protect, authorize('recruiter', 'admin', 'rh_candidatures'), getAllApplications);
router.get('/booked-slots', protect, authorize('recruiter', 'admin', 'rh_candidatures'), getBookedSlots);
router.get('/offer/:offerId', protect, authorize('recruiter', 'admin', 'rh_candidatures'), getApplicationsByOffer);
router.put('/:applicationId/status', protect, authorize('recruiter', 'admin', 'rh_candidatures'), updateApplicationStatus);
router.patch('/:applicationId/interview', protect, authorize('recruiter', 'admin', 'rh_candidatures'), scheduleInterview);
router.patch('/:applicationId/evaluate', protect, authorize('recruiter', 'admin', 'rh_candidatures'), evaluateApplication);

router.delete('/:applicationId', protect, authorize('recruiter', 'admin', 'rh_candidatures'), deleteApplication);

// Score an application (upload resume + job text) and persist matching result
router.post('/:applicationId/score', protect, authorize('recruiter', 'admin', 'rh_candidatures'), scoreApplication);

module.exports = router;
