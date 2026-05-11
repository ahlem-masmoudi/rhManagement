const express = require('express');
const router  = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('recruiter', 'admin', 'rh_offres', 'rh_candidatures'), getAnalytics);

module.exports = router;
