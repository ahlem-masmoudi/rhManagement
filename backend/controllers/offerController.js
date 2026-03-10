const Offer = require('../models/Offer');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');

// @desc    Get all offers
// @route   GET /api/offers
// @access  Public
exports.getAllOffers = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const offers = await Offer.find(filter).populate('createdBy', 'firstName lastName email').sort('-createdAt');

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

// @desc    Get single offer
// @route   GET /api/offers/:id
// @access  Public
exports.getOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('createdBy', 'firstName lastName email');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message
    });
  }
};

// @desc    Create new offer
// @route   POST /api/offers
// @access  Private (Recruiter only)
exports.createOffer = async (req, res) => {
  try {
    const offer = await Offer.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating offer',
      error: error.message
    });
  }
};

// @desc    Update offer
// @route   PUT /api/offers/:id
// @access  Private (Recruiter only)
exports.updateOffer = async (req, res) => {
  try {
    let offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Check if user is owner
    if (offer.createdBy.toString() !== req.user.id && req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this offer'
      });
    }

    offer = await Offer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating offer',
      error: error.message
    });
  }
};

// @desc    Delete offer
// @route   DELETE /api/offers/:id
// @access  Private (Recruiter only)
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Check if user is owner
    if (offer.createdBy.toString() !== req.user.id && req.user.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this offer'
      });
    }

    await offer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting offer',
      error: error.message
    });
  }
};

// @desc    Apply to offer
// @route   POST /api/offers/:id/apply
// @access  Private (Candidate only)
exports.applyToOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const candidate = await Candidate.findOne({ userId: req.user.id });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      candidate: candidate._id,
      offer: req.params.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Already applied to this offer'
      });
    }

    // Create application
    const application = await Application.create({
      candidate: candidate._id,
      offer: req.params.id,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error applying to offer',
      error: error.message
    });
  }
};
