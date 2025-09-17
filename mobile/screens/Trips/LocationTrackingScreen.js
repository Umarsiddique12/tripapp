/**
 * Location Tracking Screen
 * Displays real-time location of trip members
 * Simplified version for testing core functionality
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getActiveTripMembers, getUserLocationStatus } from '../../api/location';

const { width, height } = Dimensions.get('window');

const LocationTrackingScreen = ({ route, navigation }) => {
  const { tripId, tripName } = route.params;
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const {
    isLocationSharing,
    tripMembers,
    userLocation,
    locationPermission,
    trackingError,
    startTripLocationSharing,
    stopTripLocationSharing,
  } = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState(null);

  useEffect(() => {
    loadLocationData();
  }, []);

  // Listen for Socket.IO events to refresh data automatically
  useEffect(() => {
    if (socket) {
      const handleLocationUpdate = () => {
        console.log('Location update received, refreshing data...');
        loadLocationData();
      };

      // Listen for location sharing events
      socket.on('userStartedLocationSharing', handleLocationUpdate);
      socket.on('userStoppedLocationSharing', handleLocationUpdate);
      socket.on('activeLocationMembers', handleLocationUpdate);
      socket.on('userDisconnectedLocation', handleLocationUpdate);

      return () => {
        socket.off('userStartedLocationSharing', handleLocationUpdate);
        socket.off('userStoppedLocationSharing', handleLocationUpdate);
        socket.off('activeLocationMembers', handleLocationUpdate);
        socket.off('userDisconnectedLocation', handleLocationUpdate);
      };
    }
  }, [socket]);

  /**
   * Load initial location data
   */
  const loadLocationData = async () => {
    try {
      setIsLoading(true);
      
      // Get current location status
      const statusResponse = await getUserLocationStatus(tripId);
      setLocationStatus(statusResponse.data);
      
      // Get active members
      const membersResponse = await getActiveTripMembers(tripId);
      console.log('Active members:', membersResponse.data.activeMembers);
      
    } catch (error) {
      console.error('Load location data error:', error);
      Alert.alert('Error', 'Failed to load location data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle location sharing
   */
  const toggleLocationSharing = async () => {
    if (isLocationSharing) {
      // Stop sharing
      stopTripLocationSharing();
      Alert.alert('Location Sharing', 'You have stopped sharing your location with trip members.');
    } else {
      // Start sharing
      const success = await startTripLocationSharing(tripId);
      if (success) {
        Alert.alert('Location Sharing', 'You are now sharing your location with trip members.');
      }
    }
  };

  /**
   * Open map view in browser
   */
  const openMapView = async () => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication required to view map');
        return;
      }

      // Construct map URL with authentication
      const mapUrl = `http://192.168.1.8:5000/public/map.html?tripId=${tripId}&token=${token}&tripName=${encodeURIComponent(tripName)}`;
      
      const supported = await Linking.canOpenURL(mapUrl);
      if (supported) {
        await Linking.openURL(mapUrl);
      } else {
        Alert.alert('Error', 'Cannot open map view. Please ensure you have a web browser installed.');
      }
    } catch (error) {
      console.error('Open map error:', error);
      Alert.alert('Error', 'Failed to open map view');
    }
  };

  /**
   * Get marker color for different users
   */
  const getMarkerColor = (userId) => {
    if (userId === user.id) return '#007AFF'; // Blue for current user
    
    // Generate consistent color based on user ID
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const colorIndex = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    return colors[colorIndex];
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading location data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Trip Location</Text>
          <Text style={styles.headerSubtitle}>{tripName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Location Info Panel */}
      <ScrollView style={styles.content}>
        {/* Current User Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <View style={styles.locationCard}>
            <View style={[styles.locationDot, { backgroundColor: getMarkerColor(user.id) }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationUser}>You ({user.name})</Text>
              {userLocation ? (
                <>
                  <Text style={styles.locationCoords}>
                    📍 {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                  </Text>
                  <Text style={styles.locationAccuracy}>
                    📏 Accuracy: ~{Math.round(userLocation.accuracy || 0)}m
                  </Text>
                </>
              ) : (
                <Text style={styles.locationStatus}>Location not available</Text>
              )}
            </View>
          </View>
        </View>

        {/* Trip Members Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Trip Members ({tripMembers.length} active)
          </Text>
          
          {tripMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="location-off" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No other members sharing location</Text>
              <Text style={styles.emptySubtext}>
                Ask your trip mates to start sharing their location!
              </Text>
            </View>
          ) : (
            tripMembers.map(member => (
              <View key={member.id} style={styles.locationCard}>
                <View style={[styles.locationDot, { backgroundColor: getMarkerColor(member.id) }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationUser}>{member.name}</Text>
                  {member.location ? (
                    <>
                      <Text style={styles.locationCoords}>
                        📍 {member.location.latitude.toFixed(6)}, {member.location.longitude.toFixed(6)}
                      </Text>
                      <Text style={styles.locationTime}>
                        🕒 Updated: {member.location.timestamp.toLocaleTimeString()}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.locationStatus}>Location not available</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Location Sharing Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sharing Status</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{isLocationSharing ? '✅' : '❌'}</Text>
              <Text style={styles.statLabel}>Your Sharing</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tripMembers.length}</Text>
              <Text style={styles.statLabel}>Active Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{locationPermission === 'granted' ? '✅' : '❌'}</Text>
              <Text style={styles.statLabel}>Permission</Text>
            </View>
          </View>
        </View>

        {/* Map View Button */}
        {tripMembers.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.mapButton} onPress={openMapView}>
              <MaterialIcons name="map" size={24} color="white" />
              <Text style={styles.mapButtonText}>View on Map</Text>
              <Text style={styles.mapButtonSubtext}>Open interactive map in browser</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Error message */}
      {trackingError && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={20} color="#FF3B30" />
          <Text style={styles.errorText}>{trackingError}</Text>
        </View>
      )}

      {/* Bottom Control Panel */}
      <View style={styles.bottomPanel}>
        {/* Location sharing toggle */}
        <TouchableOpacity
          style={[
            styles.shareButton,
            { backgroundColor: isLocationSharing ? '#FF3B30' : '#007AFF' }
          ]}
          onPress={toggleLocationSharing}
          disabled={locationPermission === 'denied'}
        >
          <MaterialIcons 
            name={isLocationSharing ? 'location-off' : 'location-on'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.shareButtonText}>
            {isLocationSharing ? 'Stop Sharing Location' : 'Share My Location'}
          </Text>
        </TouchableOpacity>

        {/* Status info */}
        <Text style={styles.statusText}>
          {isLocationSharing 
            ? `🟢 Sharing location • ${tripMembers.length} other member${tripMembers.length !== 1 ? 's' : ''} active`
            : '🔴 Not sharing location'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E6',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  locationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  locationStatus: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: 'white',
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E6',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mapButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  mapButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default LocationTrackingScreen;