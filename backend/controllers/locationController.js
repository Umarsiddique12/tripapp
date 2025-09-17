/**
 * Location Tracking Controller
 * Handles HTTP endpoints for location tracking operations
 */

const Trip = require('../models/Trip');
const User = require('../models/User');

/**
 * Get active location sharing members for a trip
 * @route GET /api/location/trip/:tripId/active
 * @access Private
 */
const getActiveTripMembers = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this trip'
      });
    }

    // Get active members from location service
    const locationService = req.app.get('locationService');
    const activeMembers = locationService ? locationService.getActiveTripMembers(tripId) : [];

    // DEBUG: Log API request and response
    console.log(`=== API DEBUG: getActiveTripMembers for trip ${tripId} ===`);
    console.log(`Requested by user: ${req.user.name} (${userId})`);
    console.log(`Active members found: ${activeMembers.length}`);
    console.log('Active members data:', activeMembers);
    console.log('=======================================================');

    res.json({
      success: true,
      data: {
        tripId,
        activeMembers,
        count: activeMembers.length
      }
    });

  } catch (error) {
    console.error('Get active trip members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

/**
 * Get location tracking statistics (admin/debug endpoint)
 * @route GET /api/location/stats
 * @access Private
 */
const getTrackingStats = async (req, res) => {
  try {
    const locationService = req.app.get('locationService');
    
    if (!locationService) {
      return res.status(503).json({
        success: false,
        message: 'Location service not available'
      });
    }

    const stats = locationService.getTrackingStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get tracking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

/**
 * Get trip location sharing settings
 * @route GET /api/location/trip/:tripId/settings
 * @access Private
 */
const getTripLocationSettings = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this trip'
      });
    }

    // Get location sharing settings (can be extended to include trip-specific settings)
    const settings = {
      locationSharingEnabled: true, // This could be a trip setting
      updateInterval: 10000, // 10 seconds
      highAccuracyEnabled: true,
      backgroundTracking: false // For future implementation
    };

    res.json({
      success: true,
      data: {
        tripId,
        settings
      }
    });

  } catch (error) {
    console.error('Get trip location settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

/**
 * Update trip location sharing settings (for future implementation)
 * @route PUT /api/location/trip/:tripId/settings
 * @access Private (Trip admin only)
 */
const updateTripLocationSettings = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const { locationSharingEnabled, updateInterval, highAccuracyEnabled } = req.body;

    // Verify user is the trip creator/admin
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only trip creator can modify location settings'
      });
    }

    // Validate settings
    const validatedSettings = {
      locationSharingEnabled: Boolean(locationSharingEnabled),
      updateInterval: Math.max(5000, Math.min(60000, Number(updateInterval) || 10000)), // Between 5s and 60s
      highAccuracyEnabled: Boolean(highAccuracyEnabled)
    };

    // For now, we'll just return the validated settings
    // In the future, these could be stored in the Trip model
    res.json({
      success: true,
      message: 'Location settings updated successfully',
      data: {
        tripId,
        settings: validatedSettings
      }
    });

  } catch (error) {
    console.error('Update trip location settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

/**
 * Get user's location sharing status for a trip
 * @route GET /api/location/trip/:tripId/status
 * @access Private
 */
const getUserLocationStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    // Verify user is a member of the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const isMember = trip.members.some(member => member.toString() === userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this trip'
      });
    }

    // Check if user is actively sharing location
    const locationService = req.app.get('locationService');
    const activeMembers = locationService ? locationService.getActiveTripMembers(tripId) : [];
    const isSharing = activeMembers.some(member => member.id === userId);

    res.json({
      success: true,
      data: {
        tripId,
        userId,
        isLocationSharing: isSharing,
        tripMembersCount: trip.members.length,
        activeLocationMembersCount: activeMembers.length
      }
    });

  } catch (error) {
    console.error('Get user location status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

module.exports = {
  getActiveTripMembers,
  getTrackingStats,
  getTripLocationSettings,
  updateTripLocationSettings,
  getUserLocationStatus
};