import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tripsService } from '../../api/trips';
import { mediaService } from '../../api/media';
import moment from 'moment';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 3; // 3 columns with padding

const MediaScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTripList, setShowTripList] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await tripsService.getTrips();
      if (response.success) {
        setTrips(response.data.trips);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMediaForTrip = async (trip) => {
    try {
      setIsLoading(true);
      const response = await mediaService.getMediaByTrip(trip._id);
      if (response.success) {
        setMedia(response.data.media);
        setSelectedTrip(trip);
        setShowTripList(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load media');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    if (showTripList) {
      loadTrips();
    } else {
      loadMediaForTrip(selectedTrip);
    }
  };

  const goBackToTrips = () => {
    setShowTripList(true);
    setSelectedTrip(null);
    setMedia([]);
  };

  const openImageViewer = (mediaItem) => {
    setSelectedMedia(mediaItem);
    setShowImageViewer(true);
  };

  const renderTripItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => loadMediaForTrip(item)}
    >
      <View style={styles.tripHeader}>
        <Text style={styles.tripName}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
      
      <Text style={styles.tripDescription} numberOfLines={2}>
        {item.description || 'No description'}
      </Text>
      
      <View style={styles.tripDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.detailText}>{item.destination || 'No destination'}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="people" size={14} color="#666" />
          <Text style={styles.detailText}>
            {item.memberCount || item.members?.length || 0} members
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMediaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => openImageViewer(item)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.mediaImage}
        resizeMode="cover"
      />
      
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play-circle" size={24} color="#fff" />
        </View>
      )}
      
      {item.caption && (
        <View style={styles.captionOverlay}>
          <Text style={styles.captionText} numberOfLines={1}>
            {item.caption}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {showTripList ? 'No trips yet' : 'No media yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {showTripList 
          ? 'Create a trip to start sharing memories!'
          : 'Upload photos and videos to share with your travel companions!'
        }
      </Text>
      {!showTripList && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => navigation.navigate('UploadMedia', { tripId: selectedTrip._id })}
        >
          <Text style={styles.uploadButtonText}>Upload Media</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderImageViewer = () => (
    <Modal
      visible={showImageViewer}
      transparent
      animationType="fade"
      onRequestClose={() => setShowImageViewer(false)}
    >
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowImageViewer(false)}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        
        {selectedMedia && (
          <View style={styles.imageViewerContent}>
            <Image
              source={{ uri: selectedMedia.url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            
            <View style={styles.imageInfo}>
              <Text style={styles.imageCaption}>
                {selectedMedia.caption || 'No caption'}
              </Text>
              <Text style={styles.imageMeta}>
                Uploaded by {selectedMedia.uploadedBy?.name} • {moment(selectedMedia.createdAt).format('MMM DD, YYYY')}
              </Text>
              
              {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {selectedMedia.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTripList ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Media Gallery</Text>
            <Text style={styles.headerSubtitle}>Select a trip to view media</Text>
          </View>
          
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
        </>
      ) : (
        <>
          <View style={styles.mediaHeader}>
            <TouchableOpacity onPress={goBackToTrips} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FF9800" />
            </TouchableOpacity>
            <View style={styles.mediaHeaderInfo}>
              <Text style={styles.mediaHeaderTitle}>{selectedTrip?.name}</Text>
              <Text style={styles.mediaHeaderSubtitle}>{media.length} items</Text>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => navigation.navigate('UploadMedia', { tripId: selectedTrip._id })}
            >
              <Ionicons name="add" size={24} color="#FF9800" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={media}
            keyExtractor={(item) => item._id}
            renderItem={renderMediaItem}
            numColumns={3}
            contentContainerStyle={media.length === 0 ? styles.emptyContainer : styles.mediaGrid}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
      
      {renderImageViewer()}
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
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
  tripName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  tripDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
  },
  mediaHeaderInfo: {
    flex: 1,
  },
  mediaHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mediaHeaderSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  mediaGrid: {
    padding: 16,
  },
  mediaItem: {
    width: imageSize,
    height: imageSize,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  captionText: {
    color: '#fff',
    fontSize: 10,
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
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  fullImage: {
    flex: 1,
    width: '100%',
  },
  imageInfo: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  imageCaption: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  imageMeta: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MediaScreen;
