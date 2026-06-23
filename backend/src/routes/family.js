const express = require('express');
const router = express.Router();
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware to all endpoints in this router
router.use(authMiddleware);

// @route   GET api/family
// @desc    Get all family members for authenticated user
router.get('/', familyController.getFamilyMembers);

// @route   POST api/family
// @desc    Add a family member profile
router.post('/', familyController.addFamilyMember);

// @route   PUT api/family/:id
// @desc    Update a family member profile
router.put('/:id', familyController.updateFamilyMember);

// @route   DELETE api/family/:id
// @desc    Delete a family member profile
router.delete('/:id', familyController.deleteFamilyMember);

module.exports = router;
