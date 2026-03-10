const express = require('express');
const router = express.Router();
const {
  getAllOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  applyToOffer
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllOffers);
router.get('/:id', getOffer);

// Candidate routes
router.post('/:id/apply', protect, authorize('candidate'), applyToOffer);

// Recruiter routes
router.post('/', protect, authorize('recruiter'), createOffer);
router.put('/:id', protect, authorize('recruiter'), updateOffer);
router.delete('/:id', protect, authorize('recruiter'), deleteOffer);

module.exports = router;
