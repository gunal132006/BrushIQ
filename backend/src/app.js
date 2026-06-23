const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

app.get("/ping", (req, res) => {
  console.log("PING HIT");
  res.status(200).json({status: "pong"});
});

// Initialize Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory and debug_scans subdirectory exist
const uploadDir = path.join(__dirname, '../uploads');
const debugScansDir = path.join(uploadDir, 'debug_scans');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(debugScansDir)) {
  fs.mkdirSync(debugScansDir, { recursive: true });
}

// Serve uploaded images statically
app.use('/uploads', express.static(uploadDir));

// Serve illustrations statically from frontend public folder
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
  res.json({ message: 'Welcome to BrushIQ API server. Platform is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error occurred' });
});

module.exports = app;
