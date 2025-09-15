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
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
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

  const value = {
    socket,
    isConnected,
    joinTrip,
    leaveTrip,
    sendMessage,
    sendTyping
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
