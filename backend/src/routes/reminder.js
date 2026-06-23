const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware to all endpoints
router.use(authMiddleware);

// @route   GET api/reminders
// @desc    Get active reminders (optional filter by familyMemberId)
router.get('/', reminderController.getReminders);

// @route   POST api/reminders
// @desc    Create a reminder manually
router.post('/', reminderController.createReminder);

// @route   PUT api/reminders/:id/complete
// @desc    Mark a reminder as completed
router.put('/:id/complete', reminderController.completeReminder);

module.exports = router;
