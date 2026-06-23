const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   POST api/auth/google
// @desc    Authenticate Google login
// @access  Public
router.post('/google', authController.googleLogin);

// @route   POST api/auth/forgot-password
// @desc    Request password recovery
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   GET api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
