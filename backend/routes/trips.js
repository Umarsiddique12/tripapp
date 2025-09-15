const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  inviteMember,
  removeMember
} = require('../controllers/tripController');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// @route   POST /api/trips
// @desc    Create a new trip
// @access  Private
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trip name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('destination')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Destination cannot be more than 100 characters'),
  body('totalBudget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Total budget must be a positive number')
], validationMiddleware, createTrip);

// @route   GET /api/trips
// @desc    Get all trips for user
// @access  Private
router.get('/', getTrips);

// @route   GET /api/trips/:id
// @desc    Get single trip
// @access  Private
router.get('/:id', getTrip);

// @route   PUT /api/trips/:id
// @desc    Update trip
// @access  Private
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trip name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('destination')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Destination cannot be more than 100 characters'),
  body('totalBudget')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Total budget must be a positive number')
], validationMiddleware, updateTrip);

// @route   DELETE /api/trips/:id
// @desc    Delete trip
// @access  Private
router.delete('/:id', deleteTrip);

// @route   POST /api/trips/:id/invite
// @desc    Invite member to trip
// @access  Private
router.post('/:id/invite', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], validationMiddleware, inviteMember);

// @route   DELETE /api/trips/:id/members/:memberId
// @desc    Remove member from trip
// @access  Private
router.delete('/:id/members/:memberId', removeMember);

module.exports = router;
