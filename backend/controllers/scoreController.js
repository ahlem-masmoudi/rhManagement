const Application = require('../models/Application');
const { scoreResumeAgainstOffer, DEFAULT_WEIGHTS } = require('../utils/scoring');

exports.scoreApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const modelName = req.body.modelName || 'all-MiniLM-L6-v2';
    const weights = { ...DEFAULT_WEIGHTS, ...(req.body.weights || {}) };

    const application = await Application.findById(applicationId).populate('offer');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Ensure the application has a resumeUrl or resume file uploaded; for demo we accept resumeUrl
    const resumeUrl = application.resumeUrl;
    if (!resumeUrl) {
      return res.status(400).json({ success: false, message: 'No resumeUrl found on application' });
    }

    const result = await scoreResumeAgainstOffer({
      resumeSource: resumeUrl,
      resumeName: application.notes || '',
      offer: application.offer,
      modelName,
      weights
    });

    // Persist matching info
    application.matchingScore = result.final_score;
    application.matchingBreakdown = result.breakdown || {};
    application.matchingMeta = {
      model: result.meta?.model || modelName,
      parserError: result.meta?.parser_error || null,
      scoredAt: new Date().toISOString()
    };
    application.matchedSkills = (result.matches && result.matches.matched_required_skills) || [];
    application.missingSkills = (result.matches && result.matches.missing_required_skills) || [];

    await application.save();

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error scoring application:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
