const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Ensure JWT secret is validated on startup
require('./config/jwt');

const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Enable trust proxy for accurate client IP rate limiting behind Render/Vercel reverse proxies
app.set('trust proxy', 1);

// Disable x-powered-by header for security hardening
app.disable('x-powered-by');

// Use Helmet middleware for standard security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Configure restricted CORS policy
const rawOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map((o) => o.trim())
  : ['https://brush-iq.vercel.app', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS security policy'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general API rate limiting to all /api/ endpoints
app.use('/api/', apiLimiter);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded images statically with security response headers
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    next();
  },
  express.static(uploadDir)
);

// Serve illustrations statically from frontend public folder if available
const illustrationsDir = path.join(__dirname, '../../frontend/public/illustrations');
if (fs.existsSync(illustrationsDir)) {
  app.use('/illustrations', express.static(illustrationsDir));
}

// Define API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/family', require('./routes/family'));
app.use('/api/toothbrush', require('./routes/toothbrush'));
app.use('/api/toothbrushes', require('./routes/toothbrush'));
app.use('/api/scans', require('./routes/scan'));
app.use('/api/reminders', require('./routes/reminder'));
app.use('/api/tips', require('./routes/tip'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/system', require('./routes/system'));

// Health Routes
app.get('/health', async (req, res) => {
  const db = require('./config/db');
  const connected = db.isPgConnected();
  res.status(connected ? 200 : 503).json({
    status: 'UP',
    database: connected ? 'CONNECTED' : 'DISCONNECTED'
  });
});

app.get('/api/health', async (req, res) => {
  const db = require('./config/db');
  const connected = db.isPgConnected();
  res.status(connected ? 200 : 503).json({
    status: 'UP',
    database: connected ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to BrushIQ Production API server.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ message: 'Internal server error occurred' });
});

module.exports = app;
