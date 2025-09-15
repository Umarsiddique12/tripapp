import axios from 'axios';
import { API_BASE_URL, getHeaders } from './config';

const mediaAPI = axios.create({
  baseURL: `${API_BASE_URL}/media`,
});

// Request interceptor to add auth token
mediaAPI.interceptors.request.use(
  async (config) => {
    const headers = await getHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const mediaService = {
  // Get media for a trip
  getMediaByTrip: async (tripId, params = {}) => {
    try {
      const response = await mediaAPI.get(`/trip/${tripId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch media' };
    }
  },

  // Get single media
  getMedia: async (mediaId) => {
    try {
      const response = await mediaAPI.get(`/${mediaId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch media' };
    }
  },

  // Upload media to trip
  uploadMedia: async (tripId, mediaData) => {
    try {
      const formData = new FormData();
      formData.append('tripId', tripId);
      formData.append('media', {
        uri: mediaData.uri,
        type: mediaData.type,
        name: mediaData.name || 'media.jpg'
      });
      
      if (mediaData.caption) {
        formData.append('caption', mediaData.caption);
      }
      
      if (mediaData.tags) {
        formData.append('tags', mediaData.tags);
      }

      const headers = await getHeaders();
      delete headers['Content-Type']; // Let FormData set the content type

      const response = await mediaAPI.post('/upload', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload media' };
    }
  },

  // Update media
  updateMedia: async (mediaId, mediaData) => {
    try {
      const response = await mediaAPI.put(`/${mediaId}`, mediaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update media' };
    }
  },

  // Delete media
  deleteMedia: async (mediaId) => {
    try {
      const response = await mediaAPI.delete(`/${mediaId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete media' };
    }
  },

  // Get media statistics for trip
  getMediaStats: async (tripId) => {
    try {
      const response = await mediaAPI.get(`/trip/${tripId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch media statistics' };
    }
  }
};
