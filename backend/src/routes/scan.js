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
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'scan-' + uniqueSuffix + ext);
  }
});

// Strict File filter (extension and MIME type validation)
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only .jpg, .jpeg, .png, and .webp image files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Magic Byte (File Signature) Validation Middleware
const validateImageMagicBytes = (req, res, next) => {
  if (!req.file) return next();
  const filePath = req.file.path;
  try {
    const buffer = fs.readFileSync(filePath);
    if (buffer.length < 4) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Security Validation Failed: File too small.' });
    }

    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';

    if (!isJpeg && !isPng && !isWebp) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Security Validation Failed: Invalid image file signature.' });
    }
    next();
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res.status(400).json({ message: 'Error validating uploaded image file.' });
  }
};

// @route   POST api/scans/analyze
// @desc    Upload image and get AI wear analysis results
router.post('/analyze', upload.single('image'), validateImageMagicBytes, scanController.analyzeScan);

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
