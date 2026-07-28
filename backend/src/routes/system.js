const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/system/database-status
router.get('/database-status', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ mode: 'postgresql', connected: true });
  } catch (err) {
    res.status(500).json({ mode: 'postgresql', connected: false, error: err.message });
  }
});

module.exports = router;
