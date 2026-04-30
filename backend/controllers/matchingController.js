const axios = require('axios');
const pdfParse = require('pdf-parse');
const Candidate = require('../models/Candidate');
const Offer = require('../models/Offer');

// Extract plain text from a base64 PDF stored in candidate documents
async function extractCvText(documents) {
  const cvDoc = [...(documents || [])].reverse().find(d => d.type === 'cv' && d.content);
  if (!cvDoc) return null;

  try {
    // Strip data URI prefix if present
    const b64 = cvDoc.content.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(b64, 'base64');
    const pdf = await pdfParse(buffer);
    const text = pdf.text?.trim();
    return text && text.length > 20 ? text : null;
  } catch (e) {
    console.warn('PDF extraction failed for', cvDoc.name, ':', e.message);
    return null;
  }
}

exports.aiScoreCandidates = async (req, res) => {
  try {
    const { offerId } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured' });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    // Load candidates with their documents (needed for CV extraction)
    const candidates = await Candidate.find().populate('userId', 'firstName lastName email');
    if (candidates.length === 0) return res.json({ success: true, data: [] });

    // Extract CV text for each candidate
    const candidateProfiles = await Promise.all(candidates.map(async (c, i) => {
      const cvText = await extractCvText(c.documents);
      return { index: i + 1, candidate: c, cvText, hasCv: !!cvText };
    }));

    const offerText = [
      `Titre: ${offer.title}`,
      offer.department ? `Département: ${offer.department}` : '',
      offer.description ? `Description: ${offer.description}` : '',
      (offer.skills || []).length ? `Compétences requises: ${offer.skills.join(', ')}` : '',
      offer.location ? `Localisation: ${offer.location}` : ''
    ].filter(Boolean).join('\n');

    const withCv    = candidateProfiles.filter(p => p.hasCv);
    const withoutCv = candidateProfiles.filter(p => !p.hasCv);

    // Build candidate list for the prompt
    const candidatesList = candidateProfiles.map(({ index, candidate, cvText, hasCv }) => {
      const name = `${candidate.userId?.firstName || ''} ${candidate.userId?.lastName || ''}`.trim() || 'Inconnu';
      if (hasCv) {
        // Truncate CV text to 1500 chars to keep prompt manageable
        const excerpt = cvText.slice(0, 1500).replace(/\n{3,}/g, '\n\n');
        return `--- CANDIDAT ${index}: ${name} (CV analysé) ---\n${excerpt}`;
      } else {
        const skills = (candidate.skills || []).join(', ') || 'non renseignées';
        return `--- CANDIDAT ${index}: ${name} (pas de CV — compétences formulaire: ${skills}) ---`;
      }
    }).join('\n\n');

    const prompt = `Tu es un expert RH spécialisé dans le recrutement tech. Analyse la compatibilité entre cette offre de stage et chaque candidat.

OFFRE:
${offerText}

CANDIDATS:
${candidatesList}

Instructions:
- Pour les candidats AVEC CV: base ton analyse sur le contenu réel du CV (compétences mentionnées, projets, formation, expériences)
- Pour les candidats SANS CV: utilise leurs compétences de formulaire (analyse moins précise)
- Reconnais les synonymes techniques: JS=JavaScript, ML=Machine Learning, IA=Intelligence Artificielle, etc.

Pour chaque candidat retourne:
- index: numéro du candidat
- score: entier 0-100 (compatibilité globale avec l'offre)
- matchedSkills: tableau des compétences/technologies trouvées dans le CV qui correspondent à l'offre
- missingSkills: tableau des compétences requises absentes du CV
- reason: une phrase courte en français expliquant le score
- cvBased: true si l'analyse est basée sur un vrai CV, false sinon

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown:
[{"index":1,"score":85,"matchedSkills":["Python","SQL"],"missingSkills":["Docker"],"reason":"Solide profil data science aligné sur l'offre.","cvBased":true},...]`;

    // Try Gemini models in order
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.0-flash-lite'];
    let raw = '';
    let lastErrorMsg = '';

    for (const modelName of models) {
      try {
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { headers: { 'Content-Type': 'application/json' }, timeout: 90000 }
        );
        raw = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (raw) {
          console.log(`AI matching: success with model ${modelName}, cv-based: ${withCv.length}/${candidates.length}`);
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
      console.error('Gemini raw response:', raw.slice(0, 500));
      return res.status(500).json({ success: false, message: 'Réponse IA invalide', raw: raw.slice(0, 300) });
    }

    const data = scores.map(s => {
      const profile = candidateProfiles.find(p => p.index === s.index);
      if (!profile) return null;
      const c = profile.candidate;
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
        reason: s.reason || '',
        cvBased: s.cvBased === true,
        hasCv: profile.hasCv
      };
    }).filter(Boolean);

    res.json({
      success: true,
      count: data.length,
      cvCount: withCv.length,
      data
    });
  } catch (error) {
    console.error('AI matching error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
