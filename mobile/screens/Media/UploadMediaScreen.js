import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import { mediaService } from '../../api/media';
import { tripsService } from '../../api/trips';

const UploadMediaScreen = ({ navigation, route }) => {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTripDetails();
    requestPermissions();
  }, []);

  const loadTripDetails = async () => {
    try {
      const response = await tripsService.getTrip(tripId);
      if (response.success) {
        setTrip(response.data.trip);
        navigation.setOptions({ title: `Upload to ${response.data.trip.name}` });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trip details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to upload media.',
        [{ text: 'OK' }]
      );
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Media',
      'Choose how you want to add media',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadMedia = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image or video first');
      return;
    }

    setIsUploading(true);

    try {
      const mediaData = {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/jpeg',
        name: selectedImage.fileName || `media_${Date.now()}.jpg`
      };

      if (caption.trim()) {
        mediaData.caption = caption.trim();
      }

      if (tags.trim()) {
        mediaData.tags = tags.trim();
      }

      const response = await mediaService.uploadMedia(tripId, mediaData);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Media uploaded successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to upload media');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setCaption('');
    setTags('');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload Media</Text>
          <Text style={styles.headerSubtitle}>Share memories with {trip?.name}</Text>
        </View>

        {!selectedImage ? (
          <View style={styles.uploadSection}>
            <TouchableOpacity style={styles.uploadButton} onPress={showImagePicker}>
              <Ionicons name="camera" size={48} color="#FF9800" />
              <Text style={styles.uploadButtonText}>Select Media</Text>
              <Text style={styles.uploadButtonSubtext}>Camera or Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewSection}>
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeButton} onPress={removeSelectedImage}>
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Caption (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Add a caption..."
                  multiline
                  maxLength={200}
                />
                <Text style={styles.characterCount}>{caption.length}/200</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tags (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={tags}
                  onChangeText={setTags}
                  placeholder="beach, sunset, food (comma separated)"
                  maxLength={100}
                />
                <Text style={styles.helpText}>Separate tags with commas</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadActionButton, isUploading && styles.uploadButtonDisabled]}
              onPress={uploadMedia}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.uploadActionText}>Upload to Cloudinary</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="cloud" size={20} color="#FF9800" />
            <Text style={styles.infoText}>Media is stored securely on Cloudinary</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={20} color="#FF9800" />
            <Text style={styles.infoText}>All trip members can view your media</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="images" size={20} color="#FF9800" />
            <Text style={styles.infoText}>Supports photos and videos</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContainer: {
    flex: 1,
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
  uploadSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FF9800',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  previewSection: {
    padding: 20,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
  },
  formSection: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 44,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  uploadActionButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
});

export default UploadMediaScreen;
