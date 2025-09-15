import * as SecureStore from 'expo-secure-store';

// API Configuration
// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's IP address
const getBaseURL = () => {
  if (__DEV__) {
    // Try these URLs in order:
    // 1. localhost (works for iOS simulator)
    // 2. 10.0.2.2 (works for Android emulator)
    // 3. Your computer's IP address (works for physical devices)
    
    // You can change this to your computer's IP address if needed
    // To find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
    return 'http://10.0.2.2:5000/api'; // Android emulator
    // return 'http://localhost:5000/api'; // iOS simulator
    // return 'http://192.168.1.XXX:5000/api'; // Physical device (replace XXX with your IP)
  }
  return 'https://your-production-api.com/api';
};

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
