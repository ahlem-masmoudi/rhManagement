const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAllCandidates,
  getCandidate
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');

// Candidate routes (for authenticated candidates)
router.get('/profile', protect, authorize('candidate'), getProfile);
router.put('/profile', protect, authorize('candidate'), updateProfile);

// Recruiter routes (for viewing candidates)
router.get('/', protect, authorize('recruiter'), getAllCandidates);
router.get('/:id', protect, authorize('recruiter'), getCandidate);

module.exports = router;
