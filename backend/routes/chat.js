const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const {
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction
} = require('../controllers/chatController');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// @route   GET /api/chat/trip/:tripId
// @desc    Get chat messages for a trip
// @access  Private
router.get('/trip/:tripId', getChatMessages);

// @route   POST /api/chat/send
// @desc    Send a chat message
// @access  Private
router.post('/send', [
  body('tripId')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'video', 'file', 'system'])
    .withMessage('Invalid message type'),
  body('mediaUrl')
    .optional()
    .isURL()
    .withMessage('Media URL must be valid'),
  body('fileName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('File name cannot be more than 255 characters'),
  body('fileSize')
    .optional()
    .isNumeric()
    .isInt({ min: 0 })
    .withMessage('File size must be a positive number'),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Reply to must be a valid message ID')
], validationMiddleware, sendMessage);

// @route   PUT /api/chat/:messageId
// @desc    Edit a chat message
// @access  Private
router.put('/:messageId', [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
], validationMiddleware, editMessage);

// @route   DELETE /api/chat/:messageId
// @desc    Delete a chat message
// @access  Private
router.delete('/:messageId', deleteMessage);

// @route   POST /api/chat/:messageId/reaction
// @desc    Add reaction to message
// @access  Private
router.post('/:messageId/reaction', [
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required and cannot be more than 10 characters')
], validationMiddleware, addReaction);

// @route   DELETE /api/chat/:messageId/reaction
// @desc    Remove reaction from message
// @access  Private
router.delete('/:messageId/reaction', [
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required and cannot be more than 10 characters')
], validationMiddleware, removeReaction);

module.exports = router;
