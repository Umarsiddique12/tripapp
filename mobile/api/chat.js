import axios from 'axios';
import { API_BASE_URL, getHeaders } from './config';

const chatAPI = axios.create({
  baseURL: `${API_BASE_URL}/chat`,
});

// Request interceptor to add auth token
chatAPI.interceptors.request.use(
  async (config) => {
    const headers = await getHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const chatService = {
  // Get chat messages for a trip
  getChatMessages: async (tripId, params = {}) => {
    try {
      const response = await chatAPI.get(`/trip/${tripId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch chat messages' };
    }
  },

  // Send message
  sendMessage: async (messageData) => {
    try {
      const response = await chatAPI.post('/send', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  // Edit message
  editMessage: async (messageId, message) => {
    try {
      const response = await chatAPI.put(`/${messageId}`, { message });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to edit message' };
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      const response = await chatAPI.delete(`/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete message' };
    }
  },

  // Add reaction to message
  addReaction: async (messageId, emoji) => {
    try {
      const response = await chatAPI.post(`/${messageId}/reaction`, { emoji });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add reaction' };
    }
  },

  // Remove reaction from message
  removeReaction: async (messageId, emoji) => {
    try {
      const response = await chatAPI.delete(`/${messageId}/reaction`, { data: { emoji } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove reaction' };
    }
  }
};
