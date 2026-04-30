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
