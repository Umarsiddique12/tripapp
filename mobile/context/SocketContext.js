import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../api/config';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection with better error handling
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket'], // Force websocket transport
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
        
        // Auto-reconnect if disconnected unexpectedly
        if (reason === 'io server disconnect') {
          console.log('🔄 Server disconnected client, attempting reconnect...');
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚨 Socket connection error:', error.message);
        setIsConnected(false);
      });
      
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user, token]);

  const joinTrip = (tripId) => {
    if (socket && isConnected) {
      socket.emit('joinTrip', tripId);
    }
  };

  const leaveTrip = (tripId) => {
    if (socket && isConnected) {
      socket.emit('leaveTrip', tripId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', messageData);
    }
  };

  const sendTyping = (tripId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { tripId, isTyping });
    }
  };

  // Location tracking functions
  const startLocationSharing = (tripId) => {
    if (socket && isConnected) {
      socket.emit('startLocationSharing', { tripId });
    }
  };

  const sendLocation = (tripId, locationData) => {
    if (socket && isConnected) {
      socket.emit('sendLocation', {
        tripId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp || Date.now()
      });
    }
  };

  const stopLocationSharing = (tripId) => {
    if (socket && isConnected) {
      socket.emit('stopLocationSharing', { tripId });
    }
  };

  const value = {
    socket,
    isConnected,
    joinTrip,
    leaveTrip,
    sendMessage,
    sendTyping,
    // Location tracking functions
    startLocationSharing,
    sendLocation,
    stopLocationSharing
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
