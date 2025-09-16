import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripsService } from '../../api/trips';
import { chatService } from '../../api/chat';
import moment from 'moment';

const ChatListScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await tripsService.getTrips();
      if (response.success) {
        const tripsWithLastMessage = await Promise.all(
          response.data.trips.map(async (trip) => {
            try {
              const chatResponse = await chatService.getChatMessages(trip._id, { limit: 1 });
              return {
                ...trip,
                lastMessage: chatResponse.success && chatResponse.data.messages.length > 0 
                  ? chatResponse.data.messages[0] 
                  : null
              };
            } catch (error) {
              return { ...trip, lastMessage: null };
            }
          })
        );
        setTrips(tripsWithLastMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTrips();
  };

  const navigateToChat = (trip) => {
    navigation.navigate('TripChat', { 
      tripId: trip._id,
      tripName: trip.name 
    });
  };

  const renderTripItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigateToChat(item)}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripInfo}>
          <Text style={styles.tripName}>{item.name}</Text>
          <Text style={styles.memberCount}>
            {item.memberCount || item.members?.length || 0} members
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
      
      {item.lastMessage && (
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessageSender}>
            {item.lastMessage.senderId.name}:
          </Text>
          <Text style={styles.lastMessageText} numberOfLines={1}>
            {item.lastMessage.message}
          </Text>
          <Text style={styles.lastMessageTime}>
            {moment(item.lastMessage.createdAt).format('MMM DD, HH:mm')}
          </Text>
        </View>
      )}
      
      {!item.lastMessage && (
        <View style={styles.noMessageContainer}>
          <Text style={styles.noMessageText}>No messages yet</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No trips yet</Text>
      <Text style={styles.emptySubtitle}>
        Join a trip to start chatting with your travel companions!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item._id}
        renderItem={renderTripItem}
        contentContainerStyle={trips.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lastMessageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9C27B0',
    marginRight: 4,
  },
  lastMessageText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  lastMessageTime: {
    fontSize: 10,
    color: '#999',
  },
  noMessageContainer: {
    marginTop: 8,
  },
  noMessageText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChatListScreen;
