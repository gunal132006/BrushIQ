const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { runSeeding } = require('../db/seeder');

// GET /api/system/database-status
router.get('/database-status', (req, res) => {
  try {
    const mode = db.getDbMode();
    res.json({ mode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/system/reset-demo
router.post('/reset-demo', async (req, res) => {
  try {
    await runSeeding(db);
    res.json({ message: 'Demo environment reset and seeded successfully' });
  } catch (err) {
    console.error('Demo reset error:', err.message);
    res.status(500).json({ error: 'Failed to reset and seed demo environment' });
  }
});

module.exports = router;
