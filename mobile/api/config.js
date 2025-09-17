import * as SecureStore from 'expo-secure-store';

// NOTE: Using SecureStore instead of AsyncStorage for auth token persistence.

const getBaseURL = () => {
  // For Expo tunnel setup with multiple devices
  if (__DEV__) {
    // Use your computer's IP address - works for both emulator and physical devices via tunnel
    return 'http://192.168.1.8:5000/api';
  }
  
  // Production fallback
  return 'https://your-production-api.com/api';
};

// Alternative URLs to try if the primary one fails
export const BACKUP_URLS = [
  'http://192.168.1.8:5000/api',    // Physical device IP
  'http://10.0.2.2:5000/api',       // Android emulator
  'http://localhost:5000/api'        // Localhost fallback
];

export const API_BASE_URL = getBaseURL();

export const SOCKET_URL = __DEV__ 
  ? API_BASE_URL.replace('/api', '') 
  : 'https://your-production-api.com';

console.log('API Configuration:', { API_BASE_URL, SOCKET_URL });

// Token management
export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('authToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const setToken = async (token) => {
  try {
    await SecureStore.setItemAsync('authToken', token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

export const removeToken = async () => {
  try {
    await SecureStore.deleteItemAsync('authToken');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// API Headers
export const getHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};
