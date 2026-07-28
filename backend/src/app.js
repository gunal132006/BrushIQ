const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Disable x-powered-by header for security hardening
app.disable('x-powered-by');

// Configure CORS and standard security headers
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// Serve illustrations statically from frontend public folder if available
const illustrationsDir = path.join(__dirname, '../../frontend/public/illustrations');
if (fs.existsSync(illustrationsDir)) {
  app.use('/illustrations', express.static(illustrationsDir));
}

// Define API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/family', require('./routes/family'));
app.use('/api/toothbrushes', require('./routes/toothbrush'));
app.use('/api/scans', require('./routes/scan'));
app.use('/api/reminders', require('./routes/reminder'));
app.use('/api/tips', require('./routes/tip'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/system', require('./routes/system'));

// Health Routes
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'UP' });
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
