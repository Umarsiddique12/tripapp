/**
 * Location Tracking Context
 * Manages real-time location sharing for trip members in React Native
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert, AppState } from 'react-native';
import { useSocket } from './SocketContext';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const { socket, isConnected, startLocationSharing, sendLocation, stopLocationSharing } = useSocket();
  
  // Location tracking state
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [currentTripId, setCurrentTripId] = useState(null);
  const [tripMembers, setTripMembers] = useState(new Map()); // Map of userId -> member data
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [trackingError, setTrackingError] = useState(null);
  
  // Refs for tracking
  const locationSubscription = useRef(null);
  const locationInterval = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Location tracking settings
  const LOCATION_UPDATE_INTERVAL = 10000; // 10 seconds
  const LOCATION_ACCURACY = Location.Accuracy.High;

  useEffect(() => {
    // Check and request location permissions
    checkLocationPermissions();

    // Listen to app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription?.remove();
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for location-related socket events
      socket.on('userStartedLocationSharing', handleUserStartedLocationSharing);
      socket.on('userStoppedLocationSharing', handleUserStoppedLocationSharing);
      socket.on('receiveLocation', handleReceiveLocation);
      socket.on('userDisconnectedLocation', handleUserDisconnectedLocation);
      socket.on('activeLocationMembers', handleActiveLocationMembers);
      socket.on('locationError', handleLocationError);

      return () => {
        socket.off('userStartedLocationSharing', handleUserStartedLocationSharing);
        socket.off('userStoppedLocationSharing', handleUserStoppedLocationSharing);
        socket.off('receiveLocation', handleReceiveLocation);
        socket.off('userDisconnectedLocation', handleUserDisconnectedLocation);
        socket.off('activeLocationMembers', handleActiveLocationMembers);
        socket.off('locationError', handleLocationError);
      };
    }
  }, [socket, isConnected]);

  /**
   * Check and request location permissions
   */
  const checkLocationPermissions = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        setLocationPermission('denied');
        setTrackingError('Location permission denied');
        return false;
      }

      setLocationPermission('granted');
      setTrackingError(null);
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermission('denied');
      setTrackingError('Failed to request location permission');
      return false;
    }
  };

  /**
   * Handle app state changes (pause location tracking when app is not active)
   */
  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground - resume location tracking if it was active
      if (isLocationSharing && currentTripId) {
        resumeLocationTracking();
      }
    } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App has gone to the background - pause location tracking
      if (isLocationSharing) {
        pauseLocationTracking();
      }
    }
    appStateRef.current = nextAppState;
  };

  /**
   * Start location sharing for a trip
   */
  const startTripLocationSharing = async (tripId) => {
    try {
      setTrackingError(null);

      // Check permissions
      const hasPermission = await checkLocationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to share your location with trip members.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Get initial location with special handling for emulator
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: LOCATION_ACCURACY,
        maximumAge: 10000,
      });

      // DEBUG: Check if we're getting emulator coordinates
      const lat = initialLocation.coords.latitude;
      const lng = initialLocation.coords.longitude;
      
      // Check for default emulator location (California coordinates)
      if (lat === 37.4217937 && lng === -122.083922) {
        console.warn('🔧 Detected Android emulator default location. Using Delhi coordinates for testing.');
        // Override with Delhi coordinates for testing
        initialLocation.coords.latitude = 28.5677 + (Math.random() - 0.5) * 0.01; // Add small random offset
        initialLocation.coords.longitude = 77.2853 + (Math.random() - 0.5) * 0.01;
        initialLocation.coords.accuracy = 15;
      }
      
      console.log(`📍 Using location: ${lat}, ${lng} (accuracy: ${initialLocation.coords.accuracy}m)`);
      
      setUserLocation(initialLocation.coords);
      setCurrentTripId(tripId);
      setIsLocationSharing(true);

      // CRITICAL FIX: Start sharing with backend first
      startLocationSharing(tripId);

      // IMPORTANT: Wait for backend to process the start sharing event
      // This prevents the "Location sharing not active for this trip" error
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now send initial location (backend should be ready)
      sendLocation(tripId, {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
        accuracy: initialLocation.coords.accuracy,
        timestamp: Date.now()
      });

      // Start periodic location updates with additional delay
      setTimeout(() => {
        startLocationTracking();
      }, 500);

      return true;
    } catch (error) {
      console.error('Start location sharing error:', error);
      setTrackingError('Failed to start location sharing');
      return false;
    }
  };

  /**
   * Stop location sharing
   */
  const stopTripLocationSharing = () => {
    try {
      if (currentTripId) {
        stopLocationSharing(currentTripId);
      }

      stopLocationTracking();
      setIsLocationSharing(false);
      setCurrentTripId(null);
      setTripMembers(new Map());
      setTrackingError(null);
    } catch (error) {
      console.error('Stop location sharing error:', error);
    }
  };

  /**
   * Start location tracking
   */
  const startLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
    }

    locationInterval.current = setInterval(async () => {
      try {
        if (!currentTripId || !isLocationSharing) return;

        // Add retry logic for emulator issues
        let location = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (!location && retryCount < maxRetries) {
          try {
            location = await Location.getCurrentPositionAsync({
              accuracy: LOCATION_ACCURACY,
              maximumAge: 5000,
              timeout: 10000, // 10 second timeout
            });
            
            // Handle emulator coordinates
            if (location && location.coords.latitude === 37.4217937 && location.coords.longitude === -122.083922) {
              console.warn('🔧 Emulator detected, using Delhi area coordinates for testing');
              location.coords.latitude = 28.5677 + (Math.random() - 0.5) * 0.01;
              location.coords.longitude = 77.2853 + (Math.random() - 0.5) * 0.01;
              location.coords.accuracy = 15;
            }
            
          } catch (locationError) {
            console.log(`Location attempt ${retryCount + 1} failed:`, locationError.message);
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait before retry (helps with emulator issues)
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        if (location) {
          setUserLocation(location.coords);

          // Send location update with retry protection
          try {
            sendLocation(currentTripId, {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              timestamp: Date.now()
            });
            
            // Clear any previous errors
            if (trackingError) {
              setTrackingError(null);
            }
          } catch (sendError) {
            console.error('Failed to send location:', sendError);
          }
        } else {
          console.warn('Failed to get location after all retries');
          setTrackingError('Unable to get location - check GPS settings');
        }

      } catch (error) {
        console.error('Location tracking error:', error);
        setTrackingError('Failed to get location update');
      }
    }, LOCATION_UPDATE_INTERVAL);
  };

  /**
   * Stop location tracking
   */
  const stopLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
    
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  /**
   * Pause location tracking (for background mode)
   */
  const pauseLocationTracking = () => {
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  };

  /**
   * Resume location tracking
   */
  const resumeLocationTracking = () => {
    if (isLocationSharing && currentTripId && !locationInterval.current) {
      startLocationTracking();
    }
  };

  // Socket event handlers
  const handleUserStartedLocationSharing = (data) => {
    console.log('📍 User started location sharing:', data);
    // Refresh the members list when someone new joins
    // This helps with synchronization
    setTripMembers(prev => {
      const updated = new Map(prev);
      updated.set(data.user.id, {
        id: data.user.id,
        name: data.user.name,
        avatar: data.user.avatar,
        location: null,
        lastUpdate: new Date()
      });
      console.log(`📍 Added ${data.user.name} to local members list. Total: ${updated.size}`);
      return updated;
    });
  };

  const handleUserStoppedLocationSharing = (data) => {
    console.log('📍 User stopped location sharing:', data);
    setTripMembers(prev => {
      const updated = new Map(prev);
      updated.delete(data.user.id);
      console.log(`📍 Removed ${data.user.name} from local members list. Total: ${updated.size}`);
      return updated;
    });
  };

  const handleReceiveLocation = (data) => {
    console.log('📍 Location update received:', data);
    const { user, location } = data;
    setTripMembers(prev => {
      const updated = new Map(prev);
      updated.set(user.id, {
        ...user,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date(location.timestamp)
        }
      });
      return updated;
    });
  };

  const handleUserDisconnectedLocation = (data) => {
    console.log('User disconnected:', data);
    setTripMembers(prev => {
      const updated = new Map(prev);
      updated.delete(data.user.id);
      return updated;
    });
  };

  const handleActiveLocationMembers = (data) => {
    console.log('📍 Received active location members:', data);
    const { activeMembers } = data;
    const membersMap = new Map();
    
    activeMembers.forEach(member => {
      console.log(`Adding member to map: ${member.name} (${member.id})`);
      membersMap.set(member.id, {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        location: member.location || null,
        lastUpdate: new Date(member.lastUpdate)
      });
    });
    
    console.log(`📍 Total members in map: ${membersMap.size}`);
    setTripMembers(membersMap);
  };

  const handleLocationError = (data) => {
    console.error('Location error:', data);
    
    // Handle specific error cases
    if (data.message === 'Location sharing not active for this trip') {
      console.log('Location sharing not active - this is a timing issue, will retry automatically');
      // Don't set this as a permanent error since it's usually a timing issue
      // The next location update should work once the backend is ready
      return;
    }
    
    setTrackingError(data.message);
  };

  /**
   * Get trip members as array
   */
  const getTripMembersArray = () => {
    return Array.from(tripMembers.values());
  };

  /**
   * Get specific member location
   */
  const getMemberLocation = (userId) => {
    return tripMembers.get(userId)?.location || null;
  };

  const value = {
    // State
    isLocationSharing,
    currentTripId,
    tripMembers: getTripMembersArray(),
    userLocation,
    locationPermission,
    trackingError,
    
    // Functions
    startTripLocationSharing,
    stopTripLocationSharing,
    getMemberLocation,
    checkLocationPermissions
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};