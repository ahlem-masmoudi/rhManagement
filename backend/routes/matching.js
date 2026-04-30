const express = require('express');
const router = express.Router();
const { aiScoreCandidates } = require('../controllers/matchingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/ai-score', protect, authorize('recruiter'), aiScoreCandidates);

module.exports = router;
