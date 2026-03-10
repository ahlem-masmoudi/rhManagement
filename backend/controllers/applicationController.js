const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Offer = require('../models/Offer');
const User = require('../models/User');

// @desc    Get all applications (for recruiters)
// @route   GET /api/applications
// @access  Private (Recruiter only)
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate({
        path: 'candidate',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('offer', 'title company location type status')
      .sort('-appliedAt');

    const formattedApplications = applications.map(app => ({
      id: app._id,
      candidateId: app.candidate._id,
      candidate: {
        id: app.candidate.userId._id,
        firstName: app.candidate.userId.firstName,
        lastName: app.candidate.userId.lastName,
        email: app.candidate.userId.email,
        school: app.candidate.school || '',
        skills: app.candidate.skills || []
      },
      offerId: app.offer._id,
      offer: {
        title: app.offer.title,
        company: app.offer.company,
        location: app.offer.location,
        type: app.offer.type,
        status: app.offer.status
      },
      status: app.status,
      appliedAt: app.appliedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedApplications.length,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Get applications by offer
// @route   GET /api/applications/offer/:offerId
// @access  Private (Recruiter only)
exports.getApplicationsByOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const applications = await Application.find({ offer: offerId })
      .populate({
        path: 'candidate',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('offer', 'title company location type')
      .sort('-appliedAt');

    const formattedApplications = applications.map(app => ({
      id: app._id,
      candidateId: app.candidate._id,
      candidate: {
        id: app.candidate.userId._id,
        firstName: app.candidate.userId.firstName,
        lastName: app.candidate.userId.lastName,
        email: app.candidate.userId.email,
        school: app.candidate.school || '',
        skills: app.candidate.skills || []
      },
      offerId: app.offer._id,
      offer: {
        title: app.offer.title,
        company: app.offer.company,
        location: app.offer.location,
        type: app.offer.type
      },
      status: app.status,
      appliedAt: app.appliedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedApplications.length,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Get candidate's own applications
// @route   GET /api/applications/my
// @access  Private (Candidate only)
exports.getMyApplications = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user.id });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    const applications = await Application.find({ candidate: candidate._id })
      .populate('offer', 'title company location type duration status')
      .sort('-appliedAt');

    const formattedApplications = applications.map(app => ({
      id: app._id,
      offerId: app.offer._id,
      offer: {
        title: app.offer.title,
        company: app.offer.company,
        location: app.offer.location,
        type: app.offer.type,
        duration: app.offer.duration,
        status: app.offer.status
      },
      status: app.status,
      appliedAt: app.appliedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedApplications.length,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:applicationId/status
// @access  Private (Recruiter only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'nouveau',
      'preselectionne',
      'en_attente_documents',
      'documents_recus',
      'entretien_programme',
      'entretien_realise',
      'test_technique',
      'validation_finale',
      'offre_envoyee',
      'offre_acceptee',
      'offre_refusee',
      'rejete',
      'abandonne'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
};
