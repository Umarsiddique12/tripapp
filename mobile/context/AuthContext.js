import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, getToken } from '../api/auth';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'AUTH_START' });
      const token = await getToken();
      
      if (token) {
        const response = await authService.getProfile();
        if (response.success) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              token
            }
          });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Invalid token' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'No token found' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Authentication failed' });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(credentials);
      
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token
          }
        });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      return { success: false, message: error.message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      console.log('AuthContext: Starting registration');
      
      const response = await authService.register(userData);
      console.log('AuthContext: Registration response:', response);
      
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token
          }
        });
        return { success: true };
      } else {
        const errorMessage = response.message || 'Registration failed';
        console.log('AuthContext: Registration failed:', errorMessage);
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        return { success: false, message: errorMessage, details: response.details };
      }
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      const errorMessage = error.message || 'Registration failed';
      const errorDetails = error.details || error.error || 'Unknown error';
      
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { 
        success: false, 
        message: errorMessage, 
        details: errorDetails,
        fullError: error 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      return { success: false, message: error.message };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        dispatch({
          type: 'UPDATE_USER',
          payload: response.data.user
        });
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
