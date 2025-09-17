/**
 * Location Tracking Service
 * Handles real-time location sharing for trip members using Socket.IO
 * Provides secure, trip-specific location broadcasting
 */

class LocationTrackingService {
  constructor(io) {
    this.io = io;
    this.activeTripMembers = new Map(); // Track active members per trip
  }

  /**
   * Initialize location tracking events for a socket connection
   * @param {Object} socket - Socket.IO socket instance
   */
  initializeLocationTracking(socket) {
    // Validate socket has required user info
    if (!socket.userId || !socket.user) {
      console.error('Socket missing user information for location tracking');
      return;
    }

    console.log(`Initializing location tracking for user ${socket.user.name} (${socket.userId})`);

    // Handle location sharing start
    socket.on('startLocationSharing', async (data) => {
      try {
        console.log(`Start location sharing request from ${socket.user.name} for trip ${data.tripId}`);
        await this.handleStartLocationSharing(socket, data);
      } catch (error) {
        console.error('Start location sharing error:', error);
        socket.emit('locationError', { message: 'Failed to start location sharing' });
      }
    });

    // Handle location updates
    socket.on('sendLocation', async (data) => {
      try {
        await this.handleLocationUpdate(socket, data);
      } catch (error) {
        console.error('Send location error:', error);
        socket.emit('locationError', { message: 'Failed to send location update' });
      }
    });

    // Handle location sharing stop
    socket.on('stopLocationSharing', async (data) => {
      try {
        console.log(`Stop location sharing request from ${socket.user.name} for trip ${data.tripId}`);
        await this.handleStopLocationSharing(socket, data);
      } catch (error) {
        console.error('Stop location sharing error:', error);
        socket.emit('locationError', { message: 'Failed to stop location sharing' });
      }
    });

    // Handle disconnect - clean up location tracking
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.name} disconnecting - cleaning up location tracking`);
      this.handleUserDisconnect(socket);
    });
  }

  /**
   * Start location sharing for a user in a trip
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} data - { tripId }
   */
  async handleStartLocationSharing(socket, data) {
    const { tripId } = data;

    // Verify user is a member of the trip
    const isAuthorized = await this.verifyTripMembership(socket.userId, tripId);
    if (!isAuthorized) {
      console.log(`Access denied: User ${socket.user?.name} not a member of trip ${tripId}`);
      socket.emit('locationError', { message: 'Access denied to this trip' });
      return;
    }

    // CRITICAL FIX: Join the trip room for location sharing
    const tripKey = `trip_${tripId}`;
    socket.join(tripKey);
    console.log(`User ${socket.user?.name} joined room ${tripKey} for location sharing`);

    // Add user to active tracking
    if (!this.activeTripMembers.has(tripKey)) {
      this.activeTripMembers.set(tripKey, new Map());
      console.log(`Created new location tracking map for trip ${tripId}`);
    }

    const tripMembers = this.activeTripMembers.get(tripKey);
    
    // Check if user is already active (prevent duplicates)
    if (tripMembers.has(socket.userId)) {
      console.log(`User ${socket.user?.name} already active in trip ${tripId}, updating socket info`);
      const existingData = tripMembers.get(socket.userId);
      existingData.socketId = socket.id; // Update socket ID in case of reconnection
      existingData.lastUpdate = new Date();
      existingData.isActive = true;
    } else {
      // Add new user to tracking
      tripMembers.set(socket.userId, {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.user.name,
        userAvatar: socket.user.avatar,
        lastUpdate: new Date(),
        isActive: true
      });
      console.log(`Added user ${socket.user?.name} to location tracking for trip ${tripId}`);
    }

    // Notify other trip members that user started sharing location
    socket.to(tripKey).emit('userStartedLocationSharing', {
      user: {
        id: socket.userId,
        name: socket.user.name,
        avatar: socket.user.avatar
      },
      message: `${socket.user.name} started sharing location`
    });

    // Send current active members to the newly joined user
    const activeMembers = Array.from(tripMembers.values())
      .filter(member => member.isActive && member.userId !== socket.userId)
      .map(member => ({
        id: member.userId,
        name: member.userName,
        avatar: member.userAvatar,
        lastUpdate: member.lastUpdate
      }));

    socket.emit('activeLocationMembers', { activeMembers });

    // DEBUG: Log all room members and trip members for synchronization debugging
    const socketsInRoom = this.io.sockets.adapter.rooms.get(tripKey);
    console.log(`=== SYNC DEBUG for trip ${tripId} ===`);
    console.log(`Room ${tripKey} has ${socketsInRoom ? socketsInRoom.size : 0} sockets connected`);
    console.log(`Trip members map has ${tripMembers.size} active members`);
    console.log(`Active members being sent to ${socket.user.name}:`, activeMembers);
    console.log(`========================================`);

    console.log(`User ${socket.user.name} started location sharing in trip ${tripId}`);
  }

  /**
   * Handle location update from a user
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} data - { tripId, latitude, longitude, accuracy, timestamp }
   */
  async handleLocationUpdate(socket, data) {
    const { tripId, latitude, longitude, accuracy, timestamp } = data;

    // Validate location data
    if (!this.isValidLocation(latitude, longitude)) {
      socket.emit('locationError', { message: 'Invalid location coordinates' });
      return;
    }

    // Verify user is actively sharing location for this trip
    const tripKey = `trip_${tripId}`;
    const tripMembers = this.activeTripMembers.get(tripKey);
    
    if (!tripMembers || !tripMembers.has(socket.userId)) {
      // RACE CONDITION FIX: Instead of immediately rejecting, try to auto-start location sharing
      // This handles cases where location updates arrive before startLocationSharing is processed
      console.log(`Location update received before start sharing processed for user ${socket.user?.name} in trip ${tripId}. Auto-starting...`);
      
      try {
        // Auto-start location sharing for this user
        await this.handleStartLocationSharing(socket, { tripId });
        
        // Retry the location update after starting
        const updatedTripMembers = this.activeTripMembers.get(tripKey);
        if (!updatedTripMembers || !updatedTripMembers.has(socket.userId)) {
          socket.emit('locationError', { message: 'Location sharing not active for this trip' });
          return;
        }
      } catch (error) {
        console.error('Auto-start location sharing failed:', error);
        socket.emit('locationError', { message: 'Location sharing not active for this trip' });
        return;
      }
    }

    // Update user's location data (now guaranteed to exist)
    const tripMembersUpdated = this.activeTripMembers.get(tripKey);
    const userLocationData = tripMembersUpdated.get(socket.userId);
    userLocationData.latitude = latitude;
    userLocationData.longitude = longitude;
    userLocationData.accuracy = accuracy;
    userLocationData.lastUpdate = new Date(timestamp || Date.now());

    // Broadcast location update to other trip members
    socket.to(tripKey).emit('receiveLocation', {
      user: {
        id: socket.userId,
        name: socket.user.name,
        avatar: socket.user.avatar
      },
      location: {
        latitude,
        longitude,
        accuracy,
        timestamp: userLocationData.lastUpdate
      }
    });

    console.log(`Location update from ${socket.user.name} in trip ${tripId}: ${latitude}, ${longitude}`);
  }

  /**
   * Stop location sharing for a user
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} data - { tripId }
   */
  async handleStopLocationSharing(socket, data) {
    const { tripId } = data;
    const tripKey = `trip_${tripId}`;
    const tripMembers = this.activeTripMembers.get(tripKey);

    if (tripMembers && tripMembers.has(socket.userId)) {
      // Remove user from active tracking
      tripMembers.delete(socket.userId);

      // Leave the trip room
      socket.leave(tripKey);

      // Clean up empty trip tracking
      if (tripMembers.size === 0) {
        this.activeTripMembers.delete(tripKey);
      }

      // Notify other trip members
      socket.to(tripKey).emit('userStoppedLocationSharing', {
        user: {
          id: socket.userId,
          name: socket.user.name,
          avatar: socket.user.avatar
        },
        message: `${socket.user.name} stopped sharing location`
      });

      console.log(`User ${socket.user.name} stopped location sharing in trip ${tripId}`);
    }
  }

  /**
   * Handle user disconnect - clean up all location tracking
   * @param {Object} socket - Socket.IO socket instance
   */
  handleUserDisconnect(socket) {
    // Remove user from all active trip location tracking
    for (const [tripKey, tripMembers] of this.activeTripMembers.entries()) {
      if (tripMembers.has(socket.userId)) {
        const userLocationData = tripMembers.get(socket.userId);
        tripMembers.delete(socket.userId);

        // Notify other trip members about disconnect
        socket.to(tripKey).emit('userDisconnectedLocation', {
          user: {
            id: socket.userId,
            name: userLocationData.userName,
            avatar: userLocationData.userAvatar
          },
          message: `${userLocationData.userName} disconnected`
        });

        // Clean up empty trip tracking
        if (tripMembers.size === 0) {
          this.activeTripMembers.delete(tripKey);
        }
      }
    }

    console.log(`User ${socket.user?.name || 'Unknown'} disconnected - location tracking cleaned up`);
  }

  /**
   * Verify if user is a member of the specified trip
   * @param {String} userId - User ID
   * @param {String} tripId - Trip ID
   * @returns {Boolean} - True if user is a member
   */
  async verifyTripMembership(userId, tripId) {
    try {
      const Trip = require('../models/Trip');
      const trip = await Trip.findById(tripId);
      
      if (!trip) {
        return false;
      }

      return trip.members.some(member => member.toString() === userId);
    } catch (error) {
      console.error('Trip membership verification error:', error);
      return false;
    }
  }

  /**
   * Validate location coordinates
   * @param {Number} latitude - Latitude coordinate
   * @param {Number} longitude - Longitude coordinate
   * @returns {Boolean} - True if valid coordinates
   */
  isValidLocation(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    );
  }

  /**
   * Get active location sharing members for a trip
   * @param {String} tripId - Trip ID
   * @returns {Array} - Array of active members
   */
  getActiveTripMembers(tripId) {
    const tripKey = `trip_${tripId}`;
    const tripMembers = this.activeTripMembers.get(tripKey);
    
    if (!tripMembers) {
      return [];
    }

    return Array.from(tripMembers.values())
      .filter(member => member.isActive)
      .map(member => ({
        id: member.userId,
        name: member.userName,
        avatar: member.userAvatar,
        lastUpdate: member.lastUpdate,
        location: member.latitude ? {
          latitude: member.latitude,
          longitude: member.longitude,
          accuracy: member.accuracy
        } : null
      }));
  }

  /**
   * Get tracking statistics
   * @returns {Object} - Tracking statistics
   */
  getTrackingStats() {
    const totalTrips = this.activeTripMembers.size;
    let totalActiveUsers = 0;

    for (const tripMembers of this.activeTripMembers.values()) {
      totalActiveUsers += tripMembers.size;
    }

    return {
      totalActiveTrips: totalTrips,
      totalActiveUsers,
      timestamp: new Date()
    };
  }
}

module.exports = LocationTrackingService;