const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Trust Render/Vercel/Netlify reverse proxy so req.ip is the real client IP
// (without this, all users share the load balancer IP and rate limiting breaks)
app.set('trust proxy', 1);

// Middleware
// Configure CORS to accept common local dev origins (localhost and 127.0.0.1)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200',
  'http://127.0.0.1:4200',
  'https://rhmanagement.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // Allow any Vercel or Netlify deployment URL
    if (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app'))) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/applications', require('./routes/applications'));
// Scoring microservice health/config note (optional)
// You can set SCORING_SERVICE_URL env var to point to the scoring FastAPI service

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RH Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Scoring service diagnostic — returns URL and pings the service
app.get('/api/scoring-status', async (req, res) => {
  const url = process.env.SCORING_SERVICE_URL || '(not set — default: http://127.0.0.1:8000/score)';
  const fetch = (() => {
    try { const f = require('node-fetch'); return typeof f === 'function' ? f : f.default; } catch {}
    if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
    return null;
  })();

  async function tryFetch(targetUrl) {
    try {
      const r = await Promise.race([
        fetch(targetUrl),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 10s')), 10000))
      ]);
      const text = await r.text().catch(() => '');
      return { status: r.status, ok: r.ok, body: text.slice(0, 200) };
    } catch (e) {
      return { error: e.message };
    }
  }

  const base = url.replace(/\/score$/, '');
  const [health, scoreGet] = await Promise.all([
    fetch ? tryFetch(`${base}/health`) : Promise.resolve({ error: 'no fetch' }),
    fetch ? tryFetch(`${base}/score`) : Promise.resolve({ error: 'no fetch' })
  ]);

  res.json({ scoringServiceUrl: url, health, scoreGet });
});

// One-time seed endpoint — protected by SEED_SECRET env var
app.post('/api/seed-candidates', async (req, res) => {
  const secret = process.env.SEED_SECRET;
  if (!secret || req.headers['x-seed-secret'] !== secret) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  try {
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const Candidate = require('./models/Candidate');
    const Application = require('./models/Application');
    const Offer = require('./models/Offer');

    const candidates = [
      { firstName: 'Amine',      lastName: 'Belhaj',     school: 'ESPRIT Tunis',          skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],      status: 'nouveau' },
      { firstName: 'Sarra',      lastName: 'Mansouri',   school: 'INSAT',                 skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],        status: 'preselectionne' },
      { firstName: 'Mohamed',    lastName: 'Trabelsi',   school: 'FST Sfax',              skills: ['Java', 'Spring Boot', 'MySQL', 'Angular'],         status: 'nouveau' },
      { firstName: 'Yasmine',    lastName: 'Chaabane',   school: 'ISI Ariana',            skills: ['Angular', 'TypeScript', 'Node.js', 'CSS'],         status: 'entretien_programme' },
      { firstName: 'Khalil',     lastName: 'Mrad',       school: 'ENSI',                  skills: ['Python', 'Machine Learning', 'TensorFlow'],        status: 'nouveau' },
      { firstName: 'Nour',       lastName: 'Bouazizi',   school: 'Université Sfax',       skills: ['PHP', 'Laravel', 'MySQL', 'Vue.js'],               status: 'preselectionne' },
      { firstName: 'Rami',       lastName: 'Gharbi',     school: 'ISET Sousse',           skills: ['React', 'Redux', 'JavaScript', 'REST API'],        status: 'nouveau' },
      { firstName: 'Malek',      lastName: 'Jebali',     school: 'SUP\'COM',              skills: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD'],         status: 'test_technique' },
      { firstName: 'Houda',      lastName: 'Riahi',      school: 'ESPRIT Tunis',          skills: ['Flutter', 'Dart', 'Firebase', 'Android'],          status: 'nouveau' },
      { firstName: 'Aziz',       lastName: 'Karoui',     school: 'FSB Bizerte',           skills: ['C#', '.NET', 'SQL Server', 'Azure'],               status: 'nouveau' },
      { firstName: 'Meriem',     lastName: 'Hamdi',      school: 'ENIT',                  skills: ['Embedded Systems', 'C', 'RTOS', 'IoT'],            status: 'preselectionne' },
      { firstName: 'Yassine',    lastName: 'Sfar',       school: 'Polytechnique Sousse',  skills: ['Data Science', 'Python', 'Pandas', 'Power BI'],    status: 'nouveau' },
      { firstName: 'Chaima',     lastName: 'Boughanmi',  school: 'IHEC Carthage',         skills: ['Marketing Digital', 'SEO', 'Google Ads'],          status: 'entretien_programme' },
      { firstName: 'Fares',      lastName: 'Tlili',      school: 'ISET Jendouba',         skills: ['React Native', 'JavaScript', 'GraphQL', 'AWS'],    status: 'nouveau' },
      { firstName: 'Amel',       lastName: 'Dridi',      school: 'FST Tunis',             skills: ['Cybersecurity', 'Network', 'Linux', 'Python'],     status: 'nouveau' },
      { firstName: 'Seifeddine', lastName: 'Hadj',       school: 'ENSI',                  skills: ['Blockchain', 'Solidity', 'Web3', 'Node.js'],       status: 'preselectionne' },
      { firstName: 'Ines',       lastName: 'Ferchichi',  school: 'ESPRIT Tunis',          skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'CSS'],        status: 'nouveau' },
      { firstName: 'Bilel',      lastName: 'Marzouki',   school: 'Université Carthage',   skills: ['SAP', 'ERP', 'Business Analysis', 'SQL'],          status: 'nouveau' },
      { firstName: 'Sana',       lastName: 'Zouari',     school: 'ISI Ariana',            skills: ['Angular', 'Java', 'Spring', 'Agile'],              status: 'test_technique' },
      { firstName: 'Tarek',      lastName: 'Souissi',    school: 'ISET Bizerte',          skills: ['Android', 'Kotlin', 'Firebase', 'REST API'],       status: 'nouveau' },
      { firstName: 'Lina',       lastName: 'Azzabi',     school: 'SUP\'COM',              skills: ['5G', 'Telecom', 'Python', 'Signal Processing'],    status: 'nouveau' },
      { firstName: 'Omar',       lastName: 'Chebbi',     school: 'ESPRIT Tunis',          skills: ['Vue.js', 'Node.js', 'PostgreSQL', 'Docker'],       status: 'preselectionne' },
      { firstName: 'Dorra',      lastName: 'Khelifi',    school: 'ISTIC Manouba',         skills: ['QA Testing', 'Selenium', 'Jest', 'Cypress'],       status: 'nouveau' },
      { firstName: 'Walid',      lastName: 'Baccouche',  school: 'ISET Sfax',             skills: ['PHP', 'Symfony', 'MySQL', 'Linux'],                status: 'nouveau' },
      { firstName: 'Emna',       lastName: 'Ghannouchi', school: 'ESPRIT Tunis',          skills: ['Data Analysis', 'SQL', 'Tableau', 'Excel'],        status: 'entretien_programme' },
      { firstName: 'Hamza',      lastName: 'Nasri',      school: 'ENET\'Com Sousse',      skills: ['Cloud', 'AWS', 'Terraform', 'Jenkins'],            status: 'nouveau' },
    ];

    const offers = await Offer.find({});
    let created = 0, skipped = 0, appsCreated = 0;

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const email = `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}@test.inet.tn`;
      const existing = await User.findOne({ email });
      if (existing) { skipped++; continue; }

      const hash = await bcrypt.hash('Test1234!', 10);
      const user = await User.create({
        email, password: hash,
        firstName: c.firstName, lastName: c.lastName,
        role: 'candidate', profileComplete: true
      });

      const candidate = await Candidate.create({
        userId: user._id,
        phone: `+216 ${Math.floor(20000000 + Math.random() * 79999999)}`,
        location: ['Tunis', 'Sfax', 'Sousse', 'Ariana', 'Manouba'][i % 5] + ', Tunisie',
        school: c.school,
        educationLevel: 'Licence',
        expectedDegree: 'Licence en Informatique',
        expectedGraduation: new Date('2026-06-30'),
        availability: new Date('2026-07-01'),
        skills: c.skills
      });

      if (offers.length > 0) {
        const offer = offers[i % offers.length];
        const existing = await Application.findOne({ candidate: candidate._id, offer: offer._id });
        if (!existing) {
          await Application.create({
            candidate: candidate._id,
            offer: offer._id,
            status: c.status,
            appliedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            matchingScore: Math.floor(40 + Math.random() * 55),
            matchedSkills: c.skills.slice(0, 2)
          });
          appsCreated++;
        }
      }
      created++;
    }

    res.json({ success: true, created, skipped, appsCreated, offersFound: offers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
