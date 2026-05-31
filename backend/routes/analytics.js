const express = require('express');
const router  = express.Router();
const { getAnalytics, getFilteredPipeline, getFilteredOffers, getFilteredEducation, getFilteredScores } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const auth = [protect, authorize('recruiter', 'admin', 'rh_offres', 'rh_candidatures')];

router.get('/',        ...auth, getAnalytics);
router.get('/pipeline',...auth, getFilteredPipeline);
router.get('/offers',    ...auth, getFilteredOffers);
router.get('/education', ...auth, getFilteredEducation);
router.get('/scores',    ...auth, getFilteredScores);

module.exports = router;
