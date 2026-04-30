const express = require('express');
const router = express.Router();
const axios = require('axios');
const { aiScoreCandidates } = require('../controllers/matchingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/ai-score', protect, authorize('recruiter'), aiScoreCandidates);

// Diagnostic: list available Gemini models for this API key
router.get('/gemini-models', protect, authorize('recruiter'), async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.json({ error: 'GEMINI_API_KEY not set in env vars' });
    const r = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const names = (r.data.models || []).map(m => m.name);
    res.json({ key_prefix: key.slice(0, 8) + '...', models: names });
  } catch (e) {
    res.json({ error: e.response?.data || e.message });
  }
});

module.exports = router;
