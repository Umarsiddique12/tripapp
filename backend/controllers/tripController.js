const Trip = require('../models/Trip');
const User = require('../models/User');

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  try {
    const { name, description, startDate, endDate, destination, totalBudget } = req.body;

    const trip = await Trip.create({
      name,
      description,
      createdBy: req.user._id,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      destination,
      totalBudget: totalBudget || 0
    });

    await trip.populate('createdBy', 'name email avatar');
    await trip.populate('members', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: { trip }
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating trip'
    });
  }
};

// @desc    Get all trips for user
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    const trips = await Trip.find({
      members: req.user._id,
      isActive: true
    })
    .populate('createdBy', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { trips }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trips'
    });
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is a member of the trip
    const isMember = trip.members.some(member => member._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    res.json({
      success: true,
      data: { trip }
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trip'
    });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res) => {
  try {
    const { name, description, startDate, endDate, destination, totalBudget } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is the creator or a member
    const isCreator = trip.createdBy.toString() === req.user._id.toString();
    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());

    if (!isCreator && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to update this trip'
      });
    }

    // Update fields
    if (name) trip.name = name;
    if (description !== undefined) trip.description = description;
    if (startDate) trip.startDate = new Date(startDate);
    if (endDate) trip.endDate = new Date(endDate);
    if (destination) trip.destination = destination;
    if (totalBudget !== undefined) trip.totalBudget = totalBudget;

    await trip.save();
    await trip.populate('createdBy', 'name email avatar');
    await trip.populate('members', 'name email avatar');

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: { trip }
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating trip'
    });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Only creator can delete trip
    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only trip creator can delete the trip'
      });
    }

    trip.isActive = false;
    await trip.save();

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting trip'
    });
  }
};

// @desc    Invite member to trip
// @route   POST /api/trips/:id/invite
// @access  Private
const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is a member of the trip
    const isMember = trip.members.some(member => member.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this trip'
      });
    }

    // Find user by email
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = trip.members.some(member => member.toString() === userToInvite._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this trip'
      });
    }

    // Add user to trip
    trip.members.push(userToInvite._id);
    await trip.save();

    await trip.populate('members', 'name email avatar');

    res.json({
      success: true,
      message: 'Member invited successfully',
      data: { trip }
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while inviting member'
    });
  }
};

// @desc    Remove member from trip
// @route   DELETE /api/trips/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Only creator can remove members
    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only trip creator can remove members'
      });
    }

    // Cannot remove creator
    if (req.params.memberId === trip.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove trip creator'
      });
    }

    // Remove member
    trip.members = trip.members.filter(member => member.toString() !== req.params.memberId);
    await trip.save();

    await trip.populate('members', 'name email avatar');

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: { trip }
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  inviteMember,
  removeMember
};
