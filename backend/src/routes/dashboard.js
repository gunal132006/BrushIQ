const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/auth');

// @route   GET api/dashboard
// @desc    Get dashboard metrics (members count, toothbrushes count, averages, alert counts)
// @access  Private
router.get('/', authMiddleware, dashboardController.getDashboardData);

module.exports = router;
