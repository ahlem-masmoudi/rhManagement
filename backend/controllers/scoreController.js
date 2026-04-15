const Application = require('../models/Application');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Config: scoring service URL
const SCORING_SERVICE_URL = process.env.SCORING_SERVICE_URL || 'http://127.0.0.1:8000/score';

exports.scoreApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId).populate('offer');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Ensure the application has a resumeUrl or resume file uploaded; for demo we accept resumeUrl
    const resumeUrl = application.resumeUrl;
    if (!resumeUrl) {
      return res.status(400).json({ success: false, message: 'No resumeUrl found on application' });
    }

    // Download resume to temp file
    const tmpPath = path.join(require('os').tmpdir(), `resume_${Date.now()}${path.extname(resumeUrl)}`);
    const response = await fetch(resumeUrl);
    if (!response.ok) throw new Error(`Failed to download resume: ${response.status}`);
    const buffer = await response.buffer();
    fs.writeFileSync(tmpPath, buffer);

    // Prepare form-data
    const form = new FormData();
    form.append('job_text', application.offer ? (application.offer.description || '') : '');
    form.append('model_name', 'all-MiniLM-L6-v2');
    form.append('weights', JSON.stringify({ skills: 0.3, experience: 0.2, education: 0.1, semantic: 0.25, title: 0.05, bonus: 0.1 }));
    form.append('file', fs.createReadStream(tmpPath), { filename: path.basename(tmpPath) });

    // Forward to scoring service
    const scoreResp = await fetch(SCORING_SERVICE_URL, { method: 'POST', body: form });
    if (!scoreResp.ok) {
      const text = await scoreResp.text();
      throw new Error(`Scoring service error: ${scoreResp.status} ${text}`);
    }
    const result = await scoreResp.json();

    // Persist matching info
    application.matchingScore = result.final_score;
    application.matchingBreakdown = result.breakdown || {};
    application.matchingMeta = { model: result.get?.model || 'unknown' };
    application.matchedSkills = (result.matches && result.matches.matched_required_skills) || [];
    application.missingSkills = (result.matches && result.matches.missing_required_skills) || [];

    await application.save();

    // cleanup
    try { fs.unlinkSync(tmpPath); } catch (e) {}

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error scoring application:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
