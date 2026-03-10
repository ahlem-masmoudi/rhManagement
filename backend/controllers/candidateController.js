const Candidate = require('../models/Candidate');
const User = require('../models/User');

// @desc    Get candidate profile
// @route   GET /api/candidates/profile
// @access  Private (Candidate only)
exports.getProfile = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user.id }).populate('userId', '-password');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// @desc    Update candidate profile
// @route   PUT /api/candidates/profile
// @access  Private (Candidate only)
exports.updateProfile = async (req, res) => {
  try {
    const {
      phone,
      location,
      school,
      educationLevel,
      expectedDegree,
      expectedGraduation,
      availability,
      skills,
      linkedin,
      github,
      portfolio
    } = req.body;

    let candidate = await Candidate.findOne({ userId: req.user.id });

    if (!candidate) {
      // Create new candidate profile if doesn't exist
      candidate = await Candidate.create({
        userId: req.user.id,
        ...req.body
      });
    } else {
      // Update existing profile
      candidate = await Candidate.findOneAndUpdate(
        { userId: req.user.id },
        req.body,
        { new: true, runValidators: true }
      );
    }

    // Mark profile as complete if all required fields are filled
    const isComplete = phone && location && school && educationLevel && skills && skills.length >= 3;
    
    if (isComplete) {
      await User.findByIdAndUpdate(req.user.id, { profileComplete: true });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Get all candidates (for recruiters)
// @route   GET /api/candidates
// @access  Private (Recruiter only)
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().populate('userId', '-password');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidates',
      error: error.message
    });
  }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Private (Recruiter only)
exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('userId', '-password');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching candidate',
      error: error.message
    });
  }
};
