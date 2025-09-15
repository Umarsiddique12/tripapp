import axios from 'axios';
import { API_BASE_URL, getHeaders } from './config';

const tripsAPI = axios.create({
  baseURL: `${API_BASE_URL}/trips`,
});

// Request interceptor to add auth token
tripsAPI.interceptors.request.use(
  async (config) => {
    const headers = await getHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const tripsService = {
  // Get all trips for user
  getTrips: async () => {
    try {
      const response = await tripsAPI.get('/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch trips' };
    }
  },

  // Get single trip
  getTrip: async (tripId) => {
    try {
      const response = await tripsAPI.get(`/${tripId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch trip' };
    }
  },

  // Create new trip
  createTrip: async (tripData) => {
    try {
      const response = await tripsAPI.post('/', tripData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create trip' };
    }
  },

  // Update trip
  updateTrip: async (tripId, tripData) => {
    try {
      const response = await tripsAPI.put(`/${tripId}`, tripData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update trip' };
    }
  },

  // Delete trip
  deleteTrip: async (tripId) => {
    try {
      const response = await tripsAPI.delete(`/${tripId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete trip' };
    }
  },

  // Invite member to trip
  inviteMember: async (tripId, email) => {
    try {
      const response = await tripsAPI.post(`/${tripId}/invite`, { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to invite member' };
    }
  },

  // Remove member from trip
  removeMember: async (tripId, memberId) => {
    try {
      const response = await tripsAPI.delete(`/${tripId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove member' };
    }
  }
};
