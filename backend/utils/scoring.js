const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SCORING_SERVICE_URL = process.env.SCORING_SERVICE_URL || 'http://127.0.0.1:8000/score';
const DEFAULT_WEIGHTS = { skills: 0.3, experience: 0.2, education: 0.1, semantic: 0.25, title: 0.05, bonus: 0.1 };

function buildJobText(offer) {
  const sections = [
    offer?.title ? `Titre du poste: ${offer.title}` : '',
    offer?.department ? `Departement: ${offer.department}` : '',
    offer?.type ? `Type: ${offer.type}` : '',
    offer?.duration ? `Duree: ${offer.duration}` : '',
    offer?.location ? `Localisation: ${offer.location}` : '',
    Array.isArray(offer?.skills) && offer.skills.length ? `Competences requises:\n- ${offer.skills.join('\n- ')}` : '',
    Array.isArray(offer?.requirements) && offer.requirements.length ? `Exigences:\n- ${offer.requirements.join('\n- ')}` : '',
    offer?.description ? `Description:\n${offer.description}` : ''
  ].filter(Boolean);

  return sections.join('\n\n').trim();
}

function extensionFromMime(mimeType) {
  const normalized = String(mimeType || '').toLowerCase();
  if (normalized.includes('pdf')) return '.pdf';
  if (normalized.includes('word') || normalized.includes('docx')) return '.docx';
  if (normalized.includes('msword')) return '.doc';
  return '.pdf';
}

async function writeResumeToTempFile(resumeSource, fallbackName = 'resume.pdf') {
  if (!resumeSource) {
    throw new Error('No resume source provided');
  }

  const source = String(resumeSource).trim();

  if (source.startsWith('data:')) {
    const match = source.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid base64 resume payload');
    }

    const [, mimeType, base64Data] = match;
    const tmpPath = path.join(os.tmpdir(), `resume_${Date.now()}${extensionFromMime(mimeType)}`);
    fs.writeFileSync(tmpPath, Buffer.from(base64Data, 'base64'));
    return tmpPath;
  }

  if (/^https?:\/\//i.test(source)) {
    const tmpPath = path.join(os.tmpdir(), `resume_${Date.now()}${path.extname(source) || path.extname(fallbackName) || '.pdf'}`);
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to download resume: ${response.status}`);
    }
    const buffer = await response.buffer();
    fs.writeFileSync(tmpPath, buffer);
    return tmpPath;
  }

  throw new Error('Unsupported resume source. Expected a data URI or http(s) URL.');
}

async function scoreResumeAgainstOffer({ resumeSource, resumeName, offer, modelName = 'all-MiniLM-L6-v2', weights = {} }) {
  let tmpPath = null;

  try {
    tmpPath = await writeResumeToTempFile(resumeSource, resumeName);

    const form = new FormData();
    form.append('job_text', buildJobText(offer));
    form.append('model_name', modelName);
    form.append('weights', JSON.stringify({ ...DEFAULT_WEIGHTS, ...(weights || {}) }));
    form.append('file', fs.createReadStream(tmpPath), { filename: path.basename(tmpPath) });

    const scoreResp = await fetch(SCORING_SERVICE_URL, { method: 'POST', body: form });
    if (!scoreResp.ok) {
      const text = await scoreResp.text();
      throw new Error(`Scoring service error: ${scoreResp.status} ${text}`);
    }

    return await scoreResp.json();
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
  }
}

module.exports = {
  DEFAULT_WEIGHTS,
  buildJobText,
  scoreResumeAgainstOffer
};
