const nodeFetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const os = require('os');

const fetchImpl = (() => {
  if (typeof nodeFetch === 'function') {
    return nodeFetch;
  }
  if (nodeFetch && typeof nodeFetch.default === 'function') {
    return nodeFetch.default;
  }
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  throw new Error('No fetch implementation available');
})();

function normalizeScoringUrl(raw) {
  const fallback = 'http://127.0.0.1:8000/score';
  const value = String(raw || '').trim();
  if (!value) return fallback;

  try {
    const url = new URL(value);
    if (!url.pathname || url.pathname === '/') {
      url.pathname = '/score';
    }
    return url.toString();
  } catch (error) {
    return fallback;
  }
}

const SCORING_SERVICE_URL = normalizeScoringUrl(process.env.SCORING_SERVICE_URL || 'http://127.0.0.1:8000/score');
const DEFAULT_WEIGHTS = { skills: 0.25, experience: 0.20, education: 0.10, semantic: 0.20, title: 0.05, bonus: 0.05, completeness: 0.15 };
const DEFAULT_MODEL = process.env.SCORING_MODEL || 'intfloat/multilingual-e5-large';

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
    const response = await fetchImpl(source);
    if (!response.ok) {
      throw new Error(`Failed to download resume: ${response.status}`);
    }
    const buffer = await responseToBuffer(response);
    fs.writeFileSync(tmpPath, buffer);
    return tmpPath;
  }

  throw new Error('Unsupported resume source. Expected a data URI or http(s) URL.');
}

async function scoreResumeAgainstOffer({ resumeSource, resumeName, offer, modelName = DEFAULT_MODEL, weights = {} }) {
  let tmpPath = null;

  try {
    tmpPath = await writeResumeToTempFile(resumeSource, resumeName);

    const form = new FormData();
    form.append('job_text', buildJobText(offer));
    form.append('model_name', modelName);
    form.append('weights', JSON.stringify({ ...DEFAULT_WEIGHTS, ...(weights || {}) }));
    form.append('file', fs.createReadStream(tmpPath), { filename: path.basename(tmpPath) });

    console.log(`[scoring-client] POST ${SCORING_SERVICE_URL}`);
    const scoreResp = await fetchImpl(SCORING_SERVICE_URL, { method: 'POST', body: form });
    console.log(`[scoring-client] response status=${scoreResp.status}`);
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

async function responseToBuffer(response) {
  if (typeof response.arrayBuffer === 'function') {
    return Buffer.from(await response.arrayBuffer());
  }
  if (typeof response.buffer === 'function') {
    return await response.buffer();
  }
  throw new Error('Unsupported response body interface');
}

module.exports = {
  DEFAULT_WEIGHTS,
  buildJobText,
  scoreResumeAgainstOffer
};
