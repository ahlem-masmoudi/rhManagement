const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Offer = require('../models/Offer');
const User = require('../models/User');
const { sendInterviewEmail, sendAcceptanceEmail } = require('../services/emailService');

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

function computeFallbackMatching(app) {
  const candidateSkills = ensureArray(app.candidate?.skills).map(normalizeSkill).filter(Boolean);
  const candidateSkillSet = new Set(candidateSkills);

  let offerSkillSources = [
    ...ensureArray(app.offer?.skills),
    ...ensureArray(app.offer?.requirements)
  ];

  if (offerSkillSources.filter(Boolean).length === 0 && app.offer?.description) {
    offerSkillSources = tokenizeText([app.offer.description, app.offer.title, app.offer.department]);
  }

  const offerSkills = offerSkillSources.map(normalizeSkill).filter(Boolean);
  const uniqueOfferSkills = [...new Set(offerSkills)];

  if (candidateSkillSet.size === 0 || uniqueOfferSkills.length === 0) {
    return {
      global: 0,
      semantic: 0,
      rules: 0,
      matchedSkills: [],
      missingSkills: uniqueOfferSkills,
      explanations: {
        strengths: [],
        weaknesses: uniqueOfferSkills.length ? ['Aucune competence commune detectee pour le moment.'] : [],
        recommendations: ['Verifier que les competences de l offre sont bien renseignees.']
      }
    };
  }

  const matchedSkills = uniqueOfferSkills.filter(skill => candidateSkillSet.has(skill));
  const missingSkills = uniqueOfferSkills.filter(skill => !candidateSkillSet.has(skill));
  const skillCoverage = matchedSkills.length / uniqueOfferSkills.length;
  const candidateCoverage = matchedSkills.length / candidateSkillSet.size;
  const offerTokens = new Set(tokenizeText([
    app.offer?.title,
    app.offer?.description,
    app.offer?.department,
    app.offer?.location
  ]));
  const titleBoost = candidateSkills.some(skill => offerTokens.has(skill)) ? 1 : 0;
  const global = Math.round(Math.min(100, (skillCoverage * 70) + (candidateCoverage * 20) + (titleBoost * 10)));
  const semantic = Math.round(Math.min(100, (skillCoverage * 60) + (titleBoost * 40)));
  const rules = Math.round(Math.min(100, (skillCoverage * 80) + (candidateCoverage * 20)));

  return {
    global,
    semantic,
    rules,
    matchedSkills,
    missingSkills,
    explanations: {
      strengths: matchedSkills.length ? [`Competences alignees: ${matchedSkills.slice(0, 6).join(', ')}`] : [],
      weaknesses: missingSkills.length ? [`Competences manquantes: ${missingSkills.slice(0, 6).join(', ')}`] : [],
      recommendations: missingSkills.length ? [`Renforcer en priorite: ${missingSkills.slice(0, 3).join(', ')}`] : []
    }
  };
}

function buildMatchingExplanation(app) {
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (Array.isArray(app.matchedSkills) && app.matchedSkills.length) {
    strengths.push(`Competences alignees: ${app.matchedSkills.slice(0, 6).join(', ')}`);
  }

  if (Array.isArray(app.missingSkills) && app.missingSkills.length) {
    weaknesses.push(`Competences manquantes: ${app.missingSkills.slice(0, 6).join(', ')}`);
    recommendations.push(`Renforcer en priorite: ${app.missingSkills.slice(0, 3).join(', ')}`);
  }

  const breakdown = app.matchingBreakdown || {};
  if (typeof breakdown.experience_score === 'number') {
    if (breakdown.experience_score >= 70) {
      strengths.push(`Experience pertinente (${Math.round(breakdown.experience_score)}%)`);
    } else if (breakdown.experience_score > 0) {
      weaknesses.push(`Experience en dessous du besoin (${Math.round(breakdown.experience_score)}%)`);
    }
  }

  if (typeof breakdown.education_score === 'number') {
    if (breakdown.education_score >= 70) {
      strengths.push(`Diplome coherent (${Math.round(breakdown.education_score)}%)`);
    } else if (breakdown.education_score > 0) {
      weaknesses.push(`Diplome partiellement aligne (${Math.round(breakdown.education_score)}%)`);
    }
  }

  return { strengths, weaknesses, recommendations };
}

function formatMatchingScore(app) {
  if (typeof app.matchingScore !== 'number') {
    const fallback = computeFallbackMatching(app);
    return {
      global: null,
      semantic: null,
      rules: null,
      source: 'unscored',
      explanations: {
        strengths: [],
        weaknesses: [],
        recommendations: ['Ce score est en attente: aucun resultat du service Python n est enregistre.']
      },
      fallbackPreview: fallback
    };
  }

  const breakdown = app.matchingBreakdown || {};
  const ruleParts = [
    breakdown.skills_score,
    breakdown.experience_score,
    breakdown.education_score,
    breakdown.title_score,
    breakdown.bonus_score
  ].filter(value => typeof value === 'number');

  const rules = ruleParts.length
    ? Math.round(ruleParts.reduce((sum, value) => sum + value, 0) / ruleParts.length)
    : Math.round(app.matchingScore);

  const semantic = typeof breakdown.semantic_score === 'number'
    ? Math.round(breakdown.semantic_score)
    : rules;

  return {
    global: Math.round(app.matchingScore),
    semantic,
    rules,
    source: 'python',
    explanations: buildMatchingExplanation(app),
    breakdown: {
      skills_score:       breakdown.skills_score       ?? null,
      experience_score:   breakdown.experience_score   ?? null,
      education_score:    breakdown.education_score    ?? null,
      semantic_score:     breakdown.semantic_score     ?? null,
      title_score:        breakdown.title_score        ?? null,
      bonus_score:        breakdown.bonus_score        ?? null,
      completeness_score: breakdown.completeness_score ?? null
    }
  };
}

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
      .populate('offer', 'title company location type status department description skills requirements')
      .sort('-appliedAt');

    const formattedApplications = applications.map(app => {
      // Defensive checks: some seeded/legacy applications may have missing candidate or userId
      const candidateObj = app.candidate || {};
      const userObj = candidateObj.userId || {};
      const offerObj = app.offer || {};

      return {
        id: app._id,
        candidateId: candidateObj._id || null,
        candidate: {
          id: userObj._id || null,
          firstName: userObj.firstName || '',
          lastName: userObj.lastName || '',
          email: userObj.email || '',
          school: candidateObj.school || '',
          location: candidateObj.location || '',
          skills: candidateObj.skills || []
        },
        offerId: offerObj._id || null,
        offer: {
          title: offerObj.title || '',
          company: offerObj.company || '',
          location: offerObj.location || '',
          type: offerObj.type || '',
          status: offerObj.status || ''
        },
        status: app.status,
        appliedAt: app.appliedAt,
        matchingScore: formatMatchingScore(app),
        matchedSkills: app.matchedSkills || [],
        missingSkills: app.missingSkills || [],
        evaluation: app.evaluation || null,
        interviewDate: app.interviewDate || null,
        interviewTime: app.interviewTime || null,
        interviewNotes: app.interviewNotes || null,
        matchingBreakdown: app.matchingBreakdown || null
      };
    });

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
      .populate('offer', 'title company location type department description skills requirements')
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
        location: app.candidate.location || '',
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
      appliedAt: app.appliedAt,
      matchingScore: formatMatchingScore(app),
      matchedSkills: app.matchedSkills || [],
      missingSkills: app.missingSkills || []
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
      .populate('offer', 'title company location type duration status department description skills requirements')
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
      appliedAt: app.appliedAt,
      matchingScore: formatMatchingScore(app),
      matchedSkills: app.matchedSkills || [],
      missingSkills: app.missingSkills || []
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

    const application = await Application.findById(applicationId)
      .populate({ path: 'candidate', populate: { path: 'userId', select: 'email firstName lastName' } })
      .populate('offer', 'title');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // Send email when candidate is accepted
    if (status === 'offre_acceptee') {
      const cand = application.candidate;
      const user = cand?.userId;
      if (user?.email && cand?.trackingToken) {
        const baseUrl = process.env.FRONTEND_URL || 'https://rhmanagement.netlify.app';
        sendAcceptanceEmail({
          to: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          offerTitle: application.offer?.title,
          trackingUrl: `${baseUrl}/candidat/suivi/${cand.trackingToken}`
        }).catch(e => console.error('[EMAIL ERROR]', e.message));
      }
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ success: false, message: 'Error updating application', error: error.message });
  }
};

// @desc    Get all booked interview slots (date + time combinations already taken)
// @route   GET /api/applications/booked-slots
// @access  Private (Recruiter)
exports.getBookedSlots = async (req, res) => {
  try {
    const booked = await Application.find(
      { interviewDate: { $exists: true, $ne: null } },
      { interviewDate: 1, interviewTime: 1 }
    ).lean();
    res.json({ success: true, data: booked.map(b => ({ date: b.interviewDate, time: b.interviewTime })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule interview for an application
// @route   PATCH /api/applications/:applicationId/interview
// @access  Private (Recruiter)
exports.scheduleInterview = async (req, res) => {
  try {
    const { interviewDate, interviewTime, interviewNotes } = req.body;
    if (!interviewDate || !interviewTime) {
      return res.status(400).json({ success: false, message: 'interviewDate and interviewTime are required' });
    }

    const application = await Application.findById(req.params.applicationId)
      .populate({ path: 'candidate', populate: { path: 'userId', select: 'email firstName lastName' } })
      .populate('offer', 'title');

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    application.interviewDate = interviewDate;
    application.interviewTime = interviewTime;
    if (interviewNotes !== undefined) application.interviewNotes = interviewNotes;
    application.status = 'entretien_programme';
    await application.save();

    // Send interview email
    const cand = application.candidate;
    const user = cand?.userId;
    if (user?.email && cand?.trackingToken) {
      const baseUrl = process.env.FRONTEND_URL || 'https://rhmanagement.netlify.app';
      sendInterviewEmail({
        to: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        interviewDate,
        interviewTime,
        offerTitle: application.offer?.title,
        trackingUrl: `${baseUrl}/candidat/suivi/${cand.trackingToken}`
      }).catch(e => console.error('[EMAIL ERROR]', e.message));
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Evaluate a candidate after internship
// @route   PATCH /api/applications/:applicationId/evaluate
// @access  Private (Recruiter)
exports.evaluateApplication = async (req, res) => {
  try {
    const { rating, outcome, comment } = req.body;
    const validRatings = ['insuffisant', 'bien', 'tres_bien', 'excellent'];
    const validOutcomes = ['aucun', 'stage_suivant', 'embauche'];
    if (rating && !validRatings.includes(rating)) return res.status(400).json({ success: false, message: 'Invalid rating' });
    if (outcome && !validOutcomes.includes(outcome)) return res.status(400).json({ success: false, message: 'Invalid outcome' });

    const application = await Application.findByIdAndUpdate(
      req.params.applicationId,
      { $set: { evaluation: { rating, outcome, comment, evaluatedAt: new Date() } } },
      { new: true }
    );
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
