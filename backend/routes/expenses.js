const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const {
  addExpense,
  getExpensesByTrip,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expenseController');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// @route   POST /api/expenses
// @desc    Add expense to trip
// @access  Private
router.post('/', [
  body('tripId')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),
  body('splitType')
    .optional()
    .isIn(['equal', 'custom', 'paid_by_one'])
    .withMessage('Invalid split type'),
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('participants.*.user')
    .isMongoId()
    .withMessage('Valid user ID is required for each participant'),
  body('participants.*.amount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Participant amount must be a positive number'),
  body('category')
    .optional()
    .isIn(['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'])
    .withMessage('Invalid category'),
  body('receipt')
    .optional()
    .isURL()
    .withMessage('Receipt must be a valid URL')
], validationMiddleware, addExpense);

// @route   GET /api/expenses/trip/:tripId
// @desc    Get expenses for a trip
// @access  Private
router.get('/trip/:tripId', getExpensesByTrip);

// @route   GET /api/expenses/trip/:tripId/summary
// @desc    Get expense summary for trip
// @access  Private
router.get('/trip/:tripId/summary', getExpenseSummary);

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', getExpense);

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  body('amount')
    .optional()
    .isNumeric()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),
  body('splitType')
    .optional()
    .isIn(['equal', 'custom', 'paid_by_one'])
    .withMessage('Invalid split type'),
  body('participants')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('participants.*.user')
    .optional()
    .isMongoId()
    .withMessage('Valid user ID is required for each participant'),
  body('participants.*.amount')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Participant amount must be a positive number'),
  body('category')
    .optional()
    .isIn(['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'])
    .withMessage('Invalid category'),
  body('receipt')
    .optional()
    .isURL()
    .withMessage('Receipt must be a valid URL')
], validationMiddleware, updateExpense);

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', deleteExpense);

module.exports = router;
