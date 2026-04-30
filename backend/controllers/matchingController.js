const axios = require('axios');
const Candidate = require('../models/Candidate');
const Offer = require('../models/Offer');

exports.aiScoreCandidates = async (req, res) => {
  try {
    const { offerId } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured' });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    const candidates = await Candidate.find().populate('userId', 'firstName lastName email');
    if (candidates.length === 0) return res.json({ success: true, data: [] });

    const offerText = [
      `Titre: ${offer.title}`,
      offer.department ? `Département: ${offer.department}` : '',
      offer.description ? `Description: ${offer.description}` : '',
      (offer.skills || []).length ? `Compétences requises: ${offer.skills.join(', ')}` : '',
      offer.location ? `Localisation: ${offer.location}` : ''
    ].filter(Boolean).join('\n');

    const candidatesList = candidates.map((c, i) => {
      const name = `${c.userId?.firstName || ''} ${c.userId?.lastName || ''}`.trim() || 'Inconnu';
      const skills = (c.skills || []).join(', ') || 'non renseignées';
      const school = c.school || 'non renseignée';
      return `${i + 1}. ${name} | Compétences: ${skills} | École: ${school}`;
    }).join('\n');

    const prompt = `Tu es un expert RH. Analyse la compatibilité entre cette offre de stage et chaque candidat.

OFFRE:
${offerText}

CANDIDATS:
${candidatesList}

Pour chaque candidat retourne:
- index: numéro du candidat (1, 2, 3...)
- score: entier 0-100 représentant la compatibilité globale
- matchedSkills: tableau des compétences du candidat qui correspondent à l'offre (inclus les synonymes: JS=JavaScript, ML=Machine Learning, etc.)
- missingSkills: tableau des compétences requises que le candidat ne possède pas
- reason: une phrase courte en français expliquant le score

Réponds UNIQUEMENT avec un tableau JSON valide. Pas de markdown, pas d'explication, juste le JSON:
[{"index":1,"score":85,"matchedSkills":["React","Node.js"],"missingSkills":["Docker"],"reason":"Profil aligné sur les technos principales."},...]`;

    // Try models in order until one succeeds
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.0-flash-lite'];
    let raw = '';
    let lastErrorMsg = '';
    for (const modelName of models) {
      try {
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );
        raw = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (raw) {
          console.log(`AI matching: success with model ${modelName}`);
          break;
        }
        console.warn(`Model ${modelName} returned empty response`);
      } catch (e) {
        const detail = e.response?.data?.error?.message || e.message;
        lastErrorMsg = `${modelName}: ${detail}`;
        console.warn(`Model ${modelName} failed (${e.response?.status}):`, detail);
      }
    }
    if (!raw) {
      return res.status(500).json({ success: false, message: `Gemini inaccessible. Détail: ${lastErrorMsg}` });
    }

    let scores;
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      scores = JSON.parse(cleaned);
    } catch {
      console.error('Gemini raw response:', raw);
      return res.status(500).json({ success: false, message: 'Réponse IA invalide', raw });
    }

    const data = scores.map(s => {
      const c = candidates[s.index - 1];
      if (!c) return null;
      return {
        candidateId: c._id,
        firstName: c.userId?.firstName || '',
        lastName: c.userId?.lastName || '',
        email: c.userId?.email || '',
        school: c.school || '',
        location: c.location || '',
        skills: c.skills || [],
        score: Math.max(0, Math.min(100, s.score || 0)),
        matchedSkills: s.matchedSkills || [],
        missingSkills: s.missingSkills || [],
        reason: s.reason || ''
      };
    }).filter(Boolean);

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('AI matching error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
