const Media = require('../models/Media');
const Trip = require('../models/Trip');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

// @desc    Upload media to trip
// @route   POST /api/media/upload
// @access  Private
const uploadMedia = async (req, res) => {
  try {
    const { tripId, caption, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

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

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.path, `tripsync/trips/${tripId}`);

    // Determine media type
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    // Create media record
    const media = await Media.create({
      tripId,
      uploadedBy: req.user._id,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      type: mediaType,
      filename: req.file.originalname,
      size: uploadResult.size,
      caption,
      tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : []
    });

    await media.populate('uploadedBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully',
      data: { media }
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while uploading media'
    });
  }
};

// @desc    Get media for a trip
// @route   GET /api/media/trip/:tripId
// @access  Private
const getMediaByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { page = 1, limit = 20, type, tag } = req.query;

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

    // Build query
    const query = { tripId, isPublic: true };
    if (type) {
      query.type = type;
    }
    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    const media = await Media.find(query)
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Media.countDocuments(query);

    res.json({
      success: true,
      data: {
        media,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching media'
    });
  }
};

// @desc    Get single media
// @route   GET /api/media/:id
// @access  Private
const getMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('uploadedBy', 'name email avatar');

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Verify user is a member of the trip
    const trip = await Trip.findById(media.tripId);
    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    // Increment download count
    media.downloadCount += 1;
    await media.save();

    res.json({
      success: true,
      data: { media }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching media'
    });
  }
};

// @desc    Update media
// @route   PUT /api/media/:id
// @access  Private
const updateMedia = async (req, res) => {
  try {
    const { caption, tags, isPublic } = req.body;

    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Only the uploader can update media
    if (media.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update media you uploaded'
      });
    }

    // Update fields
    if (caption !== undefined) media.caption = caption;
    if (tags !== undefined) media.tags = tags.split(',').map(tag => tag.trim().toLowerCase());
    if (isPublic !== undefined) media.isPublic = isPublic;

    await media.save();
    await media.populate('uploadedBy', 'name email avatar');

    res.json({
      success: true,
      message: 'Media updated successfully',
      data: { media }
    });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating media'
    });
  }
};

// @desc    Delete media
// @route   DELETE /api/media/:id
// @access  Private
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Only the uploader can delete media
    if (media.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete media you uploaded'
      });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(media.publicId);

    // Delete from database
    await Media.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting media'
    });
  }
};

// @desc    Get media statistics for trip
// @route   GET /api/media/trip/:tripId/stats
// @access  Private
const getMediaStats = async (req, res) => {
  try {
    const { tripId } = req.params;

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

    const stats = await Media.aggregate([
      { $match: { tripId: trip._id, isPublic: true } },
      {
        $group: {
          _id: null,
          totalMedia: { $sum: 1 },
          totalImages: { $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] } },
          totalVideos: { $sum: { $cond: [{ $eq: ['$type', 'video'] }, 1, 0] } },
          totalSize: { $sum: '$size' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalMedia: 0,
      totalImages: 0,
      totalVideos: 0,
      totalSize: 0,
      totalDownloads: 0
    };

    res.json({
      success: true,
      data: { stats: result }
    });
  } catch (error) {
    console.error('Get media stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching media statistics'
    });
  }
};

module.exports = {
  uploadMedia,
  getMediaByTrip,
  getMedia,
  updateMedia,
  deleteMedia,
  getMediaStats
};
