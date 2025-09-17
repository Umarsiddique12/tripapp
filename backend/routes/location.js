/**
 * Location Tracking Routes
 * Handles HTTP routes for location tracking functionality
 */

const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getActiveTripMembers,
  getTrackingStats,
  getTripLocationSettings,
  updateTripLocationSettings,
  getUserLocationStatus
} = require('../controllers/locationController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/location/trip/:tripId/active
 * @desc    Get active location sharing members for a trip
 * @access  Private (Trip members only)
 */
router.get('/trip/:tripId/active', getActiveTripMembers);

/**
 * @route   GET /api/location/trip/:tripId/status
 * @desc    Get user's location sharing status for a trip
 * @access  Private (Trip members only)
 */
router.get('/trip/:tripId/status', getUserLocationStatus);

/**
 * @route   GET /api/location/trip/:tripId/settings
 * @desc    Get trip location sharing settings
 * @access  Private (Trip members only)
 */
router.get('/trip/:tripId/settings', getTripLocationSettings);

/**
 * @route   PUT /api/location/trip/:tripId/settings
 * @desc    Update trip location sharing settings
 * @access  Private (Trip creator only)
 */
router.put('/trip/:tripId/settings', updateTripLocationSettings);

/**
 * @route   GET /api/location/stats
 * @desc    Get location tracking statistics (debug/admin endpoint)
 * @access  Private
 */
router.get('/stats', getTrackingStats);

module.exports = router;