const Chat = require('../models/Chat');
const Trip = require('../models/Trip');

// @desc    Get chat messages for a trip
// @route   GET /api/chat/trip/:tripId
// @access  Private
const getChatMessages = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    const messages = await Chat.find({ 
      tripId, 
      isDeleted: false 
    })
      .populate('senderId', 'name email avatar')
      .populate('replyTo', 'message senderId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Chat.countDocuments({ tripId, isDeleted: false });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chat messages'
    });
  }
};

// @desc    Send a chat message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { tripId, message, type = 'text', mediaUrl, fileName, fileSize, replyTo } = req.body;

    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    // Validate message content based on type
    if (type === 'text' && !message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required for text messages'
      });
    }

    if (['image', 'video', 'file'].includes(type) && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required for media messages'
      });
    }

    const chatMessage = await Chat.create({
      tripId,
      senderId: req.user._id,
      message,
      type,
      mediaUrl,
      fileName,
      fileSize,
      replyTo
    });

    await chatMessage.populate('senderId', 'name email avatar');
    if (replyTo) {
      await chatMessage.populate('replyTo', 'message senderId');
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: chatMessage }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
};

// @desc    Edit a chat message
// @route   PUT /api/chat/:messageId
// @access  Private
const editMessage = async (req, res) => {
  try {
    const { message } = req.body;

    const chatMessage = await Chat.findById(req.params.messageId);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can edit their message
    if (chatMessage.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own messages'
      });
    }

    // Only text messages can be edited
    if (chatMessage.type !== 'text') {
      return res.status(400).json({
        success: false,
        message: 'Only text messages can be edited'
      });
    }

    chatMessage.message = message;
    chatMessage.isEdited = true;
    chatMessage.editedAt = new Date();
    await chatMessage.save();

    await chatMessage.populate('senderId', 'name email avatar');

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: { message: chatMessage }
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while editing message'
    });
  }
};

// @desc    Delete a chat message
// @route   DELETE /api/chat/:messageId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const chatMessage = await Chat.findById(req.params.messageId);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their message
    if (chatMessage.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own messages'
      });
    }

    chatMessage.isDeleted = true;
    chatMessage.deletedAt = new Date();
    await chatMessage.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/chat/:messageId/reaction
// @access  Private
const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;

    const chatMessage = await Chat.findById(req.params.messageId);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = chatMessage.reactions.find(
      reaction => reaction.user.toString() === req.user._id.toString() && reaction.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({
        success: false,
        message: 'You have already reacted with this emoji'
      });
    }

    // Add reaction
    chatMessage.reactions.push({
      user: req.user._id,
      emoji
    });

    await chatMessage.save();
    await chatMessage.populate('reactions.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Reaction added successfully',
      data: { message: chatMessage }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding reaction'
    });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/chat/:messageId/reaction
// @access  Private
const removeReaction = async (req, res) => {
  try {
    const { emoji } = req.body;

    const chatMessage = await Chat.findById(req.params.messageId);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Remove reaction
    chatMessage.reactions = chatMessage.reactions.filter(
      reaction => !(reaction.user.toString() === req.user._id.toString() && reaction.emoji === emoji)
    );

    await chatMessage.save();
    await chatMessage.populate('reactions.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Reaction removed successfully',
      data: { message: chatMessage }
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing reaction'
    });
  }
};

module.exports = {
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction
};
