import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripsService } from '../../api/trips';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';

const TripDetailsScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTripDetails();
  }, [tripId]);

  const loadTripDetails = async () => {
    try {
      const response = await tripsService.getTrip(tripId);
      if (response.success) {
        setTrip(response.data.trip);
      } else {
        Alert.alert('Error', response.message);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trip details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTripDetails();
  };

  const handleInviteMember = () => {
    navigation.navigate('InviteMember', { tripId });
  };

  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await tripsService.deleteTrip(tripId);
              if (response.success) {
                Alert.alert('Success', 'Trip deleted successfully', [
                  { text: 'OK', onPress: () => navigation.navigate('TripsList') }
                ]);
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete trip');
            }
          }
        }
      ]
    );
  };

  const isCreator = trip?.createdBy?._id === user?.id;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.tripName}>{trip.name}</Text>
        <View style={styles.statusBadge}>
          <Ionicons 
            name="airplane" 
            size={16} 
            color={trip.isActive ? '#4CAF50' : '#999'} 
          />
          <Text style={[styles.statusText, { color: trip.isActive ? '#4CAF50' : '#999' }]}>
            {trip.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {trip.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{trip.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        <View style={styles.detailsGrid}>
          {trip.destination && (
            <View style={styles.detailItem}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Destination</Text>
                <Text style={styles.detailValue}>{trip.destination}</Text>
              </View>
            </View>
          )}

          {trip.startDate && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color="#2196F3" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {moment(trip.startDate).format('MMM DD, YYYY')}
                </Text>
              </View>
            </View>
          )}

          {trip.endDate && (
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={20} color="#2196F3" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>
                  {moment(trip.endDate).format('MMM DD, YYYY')}
                </Text>
              </View>
            </View>
          )}

          {trip.totalBudget > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="card" size={20} color="#2196F3" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Total Budget</Text>
                <Text style={styles.detailValue}>${trip.totalBudget}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({trip.members?.length || 0})</Text>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={handleInviteMember}
          >
            <Ionicons name="person-add" size={16} color="#2196F3" />
            <Text style={styles.inviteButtonText}>Invite</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.membersList}>
          {trip.members?.map((member) => (
            <View key={member._id} style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitial}>
                  {member.name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              {member._id === trip.createdBy?._id && (
                <View style={styles.creatorBadge}>
                  <Text style={styles.creatorText}>Creator</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="card" size={24} color="#4CAF50" />
            <Text style={styles.actionText}>Expenses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="images" size={24} color="#FF9800" />
            <Text style={styles.actionText}>Media</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TripChat', { 
              tripId: trip._id, 
              tripName: trip.name 
            })}
          >
            <Ionicons name="chatbubbles" size={24} color="#9C27B0" />
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isCreator && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteTrip}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Trip</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Created by {trip.createdBy?.name} on {moment(trip.createdAt).format('MMM DD, YYYY')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tripName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
  },
  inviteButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  creatorBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  creatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 80,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default TripDetailsScreen;
