/**
 * Location API Service
 * Handles HTTP requests for location tracking functionality
 */

import { API_BASE_URL, getHeaders } from './config';
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add authentication headers to all requests
api.interceptors.request.use(
  async (config) => {
    const headers = await getHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Get active location sharing members for a trip
 * @param {string} tripId - Trip ID
 * @returns {Promise} - API response
 */
export const getActiveTripMembers = async (tripId) => {
  try {
    const response = await api.get(`/location/trip/${tripId}/active`);
    return response.data;
  } catch (error) {
    console.error('Get active trip members error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get active trip members');
  }
};

/**
 * Get user's location sharing status for a trip
 * @param {string} tripId - Trip ID
 * @returns {Promise} - API response
 */
export const getUserLocationStatus = async (tripId) => {
  try {
    const response = await api.get(`/location/trip/${tripId}/status`);
    return response.data;
  } catch (error) {
    console.error('Get user location status error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get location status');
  }
};

/**
 * Get trip location sharing settings
 * @param {string} tripId - Trip ID
 * @returns {Promise} - API response
 */
export const getTripLocationSettings = async (tripId) => {
  try {
    const response = await api.get(`/location/trip/${tripId}/settings`);
    return response.data;
  } catch (error) {
    console.error('Get trip location settings error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get location settings');
  }
};

/**
 * Update trip location sharing settings
 * @param {string} tripId - Trip ID
 * @param {Object} settings - Location settings
 * @returns {Promise} - API response
 */
export const updateTripLocationSettings = async (tripId, settings) => {
  try {
    const response = await api.put(`/location/trip/${tripId}/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Update trip location settings error:', error);
    throw new Error(error.response?.data?.message || 'Failed to update location settings');
  }
};

/**
 * Get location tracking statistics (debug/admin)
 * @returns {Promise} - API response
 */
export const getLocationStats = async () => {
  try {
    const response = await api.get('/location/stats');
    return response.data;
  } catch (error) {
    console.error('Get location stats error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get location stats');
  }
};