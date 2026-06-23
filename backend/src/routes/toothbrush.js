const express = require('express');
const router = express.Router();
const toothbrushController = require('../controllers/toothbrushController');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware to all endpoints
router.use(authMiddleware);

// @route   GET api/toothbrushes
// @desc    Get toothbrushes (optional filter by familyMemberId)
router.get('/', toothbrushController.getToothbrushes);

// @route   POST api/toothbrushes
// @desc    Add a toothbrush
router.post('/', toothbrushController.addToothbrush);

// @route   PUT api/toothbrushes/:id
// @desc    Update a toothbrush details
router.put('/:id', toothbrushController.updateToothbrush);

// @route   DELETE api/toothbrushes/:id
// @desc    Remove a toothbrush record
router.delete('/:id', toothbrushController.deleteToothbrush);

module.exports = router;
