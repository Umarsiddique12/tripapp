const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: [true, 'Media URL is required']
  },
  publicId: {
    type: String, // Cloudinary public ID
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number, // File size in bytes
    default: 0
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [200, 'Caption cannot be more than 200 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
mediaSchema.index({ tripId: 1, createdAt: -1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ type: 1 });

module.exports = mongoose.model('Media', mediaSchema);
