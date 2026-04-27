const Offer = require('../models/Offer');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const { scoreResumeAgainstOffer } = require('../utils/scoring');

function normalizeSkill(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined || value === '') {
    return [];
  }

  return [value];
}

function tokenizeText(values) {
  return ensureArray(values)
    .reduce((tokens, value) => tokens.concat(normalizeSkill(value).split(' ')), [])
    .map(token => token.trim())
    .filter(token => token.length >= 2);
}

function scoreOfferForCandidate(candidate, offer) {
  const candidateSkills = ensureArray(candidate.skills).map(normalizeSkill).filter(Boolean);
  const candidateSkillSet = new Set(candidateSkills);

  // Combine explicit skills + requirements. If both empty, fall back to tokenizing
  // the description so offers created without a skills list still get scored.
  let offerSkillSources = [...ensureArray(offer.skills), ...ensureArray(offer.requirements)];
  if (offerSkillSources.filter(Boolean).length === 0 && offer.description) {
    offerSkillSources = tokenizeText([offer.description, offer.title]);
  }
  const offerSkills = offerSkillSources.map(normalizeSkill).filter(Boolean);
  const uniqueOfferSkills = [...new Set(offerSkills)];

  if (candidateSkillSet.size === 0 || uniqueOfferSkills.length === 0) {
    return {
      compatibilityScore: 0,
      matchedSkills: [],
      missingSkills: uniqueOfferSkills,
      compatibilityLabel: uniqueOfferSkills.length === 0 ? 'Non spécifiée' : 'Faible'
    };
  }

  const matchedSkills = uniqueOfferSkills.filter(skill => candidateSkillSet.has(skill));
  const missingSkills = uniqueOfferSkills.filter(skill => !candidateSkillSet.has(skill));

  const skillCoverage = matchedSkills.length / uniqueOfferSkills.length;
  const candidateCoverage = matchedSkills.length / candidateSkillSet.size;

  const offerTokens = new Set(tokenizeText([
    offer.title,
    offer.description,
    offer.department,
    offer.location
  ]));
  const titleBoost = candidateSkills.some(skill => offerTokens.has(skill)) ? 1 : 0;

  const score = Math.round(
    Math.min(
      100,
      (skillCoverage * 70) +
      (candidateCoverage * 20) +
      (titleBoost * 10)
    )
  );

  let compatibilityLabel = 'Faible';
  if (score >= 75) compatibilityLabel = 'Excellente';
  else if (score >= 55) compatibilityLabel = 'Bonne';
  else if (score >= 35) compatibilityLabel = 'Moyenne';

  return {
    compatibilityScore: score,
    matchedSkills,
    missingSkills,
    compatibilityLabel
  };
}

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

// @desc    Get recommended offers for the logged-in candidate
// @route   GET /api/offers/recommended
// @access  Private (Candidate only)
exports.getRecommendedOffers = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ userId: req.user.id });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }

    // Include active/draft offers. Also accept frontend status values ('publiee', 'published')
    // in case some documents were saved before the status mapping was applied.
    const offers = await Offer.find({
      status: { $in: ['active', 'draft', 'publiee', 'published'] }
    })
      .populate('createdBy', 'firstName lastName email')
      .sort('-createdAt');

    console.log(`[recommended] candidate skills: ${JSON.stringify(candidate.skills)}`);
    console.log(`[recommended] offers found: ${offers.length} (active+draft)`);
    offers.forEach(o => {
      console.log(`  offer "${o.title}" skills: ${JSON.stringify(o.skills)} requirements: ${JSON.stringify(o.requirements)}`);
    });

    const scoredOffers = offers
      .map(offer => {
        const scoring = scoreOfferForCandidate(candidate, offer);
        return {
          ...offer.toObject(),
          ...scoring
        };
      })
      .filter(offer => offer.compatibilityScore > 0)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    console.log(`[recommended] scored offers returned: ${scoredOffers.length}`);
    scoredOffers.forEach(o => {
      console.log(`  "${o.title}" score=${o.compatibilityScore} matched=${JSON.stringify(o.matchedSkills)}`);
    });

    res.status(200).json({
      success: true,
      count: scoredOffers.length,
      candidateSkills: candidate.skills || [],
      data: scoredOffers
    });
  } catch (error) {
    console.error('Error in getRecommendedOffers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommended offers',
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

    // Normalize status: map frontend values to backend enum values
    const body = { ...req.body };
    const statusMap = { publiee: 'active', published: 'active', brouillon: 'draft', archivee: 'closed' };
    if (body.status && statusMap[body.status]) body.status = statusMap[body.status];

    offer = await Offer.findByIdAndUpdate(req.params.id, body, {
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

    // Create application - use 'nouveau' to match Application schema enum
    const application = await Application.create({
      candidate: candidate._id,
      offer: req.params.id,
      status: 'nouveau',
      coverLetter: req.body.coverLetter || '',
      resumeUrl: req.body.cvBase64 || '',
      notes: req.body.cvName ? `CV: ${req.body.cvName}` : ''
    });

    // Best-effort auto scoring: the application is still considered submitted
    // even if the Python scoring service is unavailable.
    if (application.resumeUrl) {
      try {
        console.log(`[scoring] attempt application=${application._id} offer=${req.params.id}`);
        const scoringResult = await scoreResumeAgainstOffer({
          resumeSource: application.resumeUrl,
          resumeName: req.body.cvName || '',
          offer
        });

        application.matchingScore = scoringResult.final_score;
        application.matchingBreakdown = scoringResult.breakdown || {};
        application.matchingMeta = {
          model: scoringResult.meta?.model || 'all-MiniLM-L6-v2',
          parserError: scoringResult.meta?.parser_error || null,
          scoredAt: new Date().toISOString(),
          autoScored: true
        };
        application.matchedSkills = scoringResult.matches?.matched_required_skills || [];
        application.missingSkills = scoringResult.matches?.missing_required_skills || [];

        await application.save();
        console.log(`[scoring] success application=${application._id} final_score=${scoringResult.final_score}`);
      } catch (scoringError) {
        application.matchingMeta = {
          ...(application.matchingMeta || {}),
          autoScored: false,
          scoringError: scoringError.message,
          scoredAt: new Date().toISOString()
        };
        await application.save();
        console.warn(`[scoring] skipped application=${application._id}: ${scoringError.message}`);
      }
    } else {
      console.warn(`[scoring] skipped application=${application._id}: missing resumeUrl`);
    }

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
