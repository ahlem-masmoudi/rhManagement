const express = require('express');
const router  = express.Router();
const { getAnalytics, getFilteredPipeline, getFilteredOffers } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const auth = [protect, authorize('recruiter', 'admin', 'rh_offres', 'rh_candidatures')];

router.get('/',        ...auth, getAnalytics);
router.get('/pipeline',...auth, getFilteredPipeline);
router.get('/offers',  ...auth, getFilteredOffers);

module.exports = router;
