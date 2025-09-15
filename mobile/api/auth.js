import axios from 'axios';
import { API_BASE_URL, getHeaders, setToken, removeToken } from './config';

const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
});

// Request interceptor to add auth token
authAPI.interceptors.request.use(
  async (config) => {
    const headers = await getHeaders();
    config.headers = { ...config.headers, ...headers };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      // You can dispatch a logout action here if using Redux
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Register user
  register: async (userData) => {
    try {
      console.log('Attempting registration with:', { 
        name: userData.name, 
        email: userData.email,
        hasPassword: !!userData.password 
      });
      
      const response = await authAPI.post('/register', userData);
      console.log('Registration response:', response.data);
      
      if (response.data.success && response.data.data.token) {
        await setToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // Return structured error information
      const errorData = error.response?.data || { 
        success: false, 
        message: 'Network error or server unreachable',
        details: error.message 
      };
      
      throw errorData;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      console.log('Attempting login with:', { email: credentials.email });
      
      const response = await authAPI.post('/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.data.token) {
        await setToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      const errorData = error.response?.data || { 
        success: false, 
        message: 'Network error or server unreachable',
        details: error.message 
      };
      
      throw errorData;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await authAPI.get('/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await authAPI.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await authAPI.put('/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Logout
  logout: async () => {
    try {
      await removeToken();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      throw { message: 'Logout failed' };
    }
  }
};
