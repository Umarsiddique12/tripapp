const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const {
  uploadMedia,
  getMediaByTrip,
  getMedia,
  updateMedia,
  deleteMedia,
  getMediaStats
} = require('../controllers/mediaController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// All routes are protected
router.use(authMiddleware);

// @route   POST /api/media/upload
// @desc    Upload media to trip
// @access  Private
router.post('/upload', upload.single('media'), [
  body('tripId')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Caption cannot be more than 200 characters'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string')
], validationMiddleware, uploadMedia);

// @route   GET /api/media/trip/:tripId
// @desc    Get media for a trip
// @access  Private
router.get('/trip/:tripId', getMediaByTrip);

// @route   GET /api/media/trip/:tripId/stats
// @desc    Get media statistics for trip
// @access  Private
router.get('/trip/:tripId/stats', getMediaStats);

// @route   GET /api/media/:id
// @desc    Get single media
// @access  Private
router.get('/:id', getMedia);

// @route   PUT /api/media/:id
// @desc    Update media
// @access  Private
router.put('/:id', [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Caption cannot be more than 200 characters'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], validationMiddleware, updateMedia);

// @route   DELETE /api/media/:id
// @desc    Delete media
// @access  Private
router.delete('/:id', deleteMedia);

module.exports = router;
