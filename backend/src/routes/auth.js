const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', authLimiter, authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authLimiter, authController.login);

// @route   POST api/auth/google
// @desc    Authenticate Google login
// @access  Public
router.post('/google', authLimiter, authController.googleLogin);

// @route   POST api/auth/forgot-password
// @desc    Request password recovery
// @access  Public
router.post('/forgot-password', authLimiter, authController.forgotPassword);

// @route   POST api/auth/reset-password
// @desc    Reset password using valid token
// @access  Public
router.post('/reset-password', authLimiter, authController.resetPassword);

// @route   GET api/auth/reset-password-page
// @desc    Serve HTML password reset page
// @access  Public
router.get('/reset-password-page', authController.renderResetPasswordPage);

// @route   POST api/auth/change-password
// @desc    Update current user password
// @access  Private
router.post('/change-password', authMiddleware, authLimiter, authController.changePassword);

// @route   GET api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

// @route   POST api/auth/reset-limiter
// @desc    Development helper to clear rate-limit lockout state for testing
// @access  Public (Restricted to Development mode inside controller handler)
const { resetAuthLimiter } = require('../middlewares/rateLimiter');
router.post('/reset-limiter', resetAuthLimiter);

module.exports = router;
