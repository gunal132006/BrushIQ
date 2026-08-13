const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const familyController = require('../controllers/familyController');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware to all endpoints in this router
router.use(authMiddleware);

// Configure Multer for profile photos
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// @route   POST api/family/upload-photo
// @desc    Upload family member profile photo
router.post('/upload-photo', upload.single('photo'), familyController.uploadProfilePhoto);

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
