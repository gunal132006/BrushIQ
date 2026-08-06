const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/auth');

// GET /api/system/database-status (Protected diagnostic endpoint)
router.get('/database-status', authMiddleware, async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ mode: 'postgresql', connected: true });
  } catch (err) {
    res.status(500).json({ mode: 'postgresql', connected: false, message: 'Database service unavailable' });
  }
});

module.exports = router;
