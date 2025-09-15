const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: function() {
      return this.type === 'text';
    },
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'system'],
    default: 'text'
  },
  mediaUrl: {
    type: String,
    required: function() {
      return ['image', 'video', 'file'].includes(this.type);
    }
  },
  fileName: {
    type: String,
    required: function() {
      return ['image', 'video', 'file'].includes(this.type);
    }
  },
  fileSize: {
    type: Number,
    default: 0
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
chatSchema.index({ tripId: 1, createdAt: -1 });
chatSchema.index({ senderId: 1 });
chatSchema.index({ type: 1 });

// Virtual for reaction count
chatSchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Ensure virtual fields are serialized
chatSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Chat', chatSchema);
