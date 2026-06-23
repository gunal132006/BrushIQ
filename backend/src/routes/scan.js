const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const scanController = require('../controllers/scanController');
const authMiddleware = require('../middlewares/auth');

// Apply auth middleware
router.use(authMiddleware);

// Configure Multer storage
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
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'scan-' + uniqueSuffix + ext);
  }
});

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only images are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   POST api/scans/analyze
// @desc    Upload image and get AI wear analysis results
router.post('/analyze', upload.single('image'), scanController.analyzeScan);

// @route   POST api/scans
// @desc    Persist scan result to database history
router.post('/', scanController.saveScan);

// @route   GET api/scans
// @desc    Get scan history for a toothbrush
router.get('/', scanController.getScansHistory);

// @route   GET api/scans/:id
// @desc    Get single scan details
router.get('/:id', scanController.getScanById);

module.exports = router;
