const express = require('express');
const router = express.Router();
const tipController = require('../controllers/tipController');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware to all endpoints
router.use(authMiddleware);

// @route   GET api/tips
// @desc    Get all general tips
router.get('/', tipController.getTips);

// @route   GET api/tips/personalized
// @desc    Get dynamic AI-personalized tips based on member scans history
router.get('/personalized', tipController.getPersonalizedTips);

module.exports = router;
