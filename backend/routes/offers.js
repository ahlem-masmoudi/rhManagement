const express = require('express');
const router = express.Router();
const {
  getAllOffers,
  getRecommendedOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  applyToOffer
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllOffers);
router.get('/recommended', protect, authorize('candidate'), getRecommendedOffers);
router.get('/:id', getOffer);

// Candidate routes
router.post('/:id/apply', protect, authorize('candidate'), applyToOffer);

// Recruiter routes
router.post('/', protect, authorize('recruiter', 'rh_offres'), createOffer);
router.put('/:id', protect, authorize('recruiter', 'rh_offres'), updateOffer);
router.delete('/:id', protect, authorize('recruiter', 'rh_offres'), deleteOffer);

module.exports = router;
