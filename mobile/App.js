import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LocationProvider } from './context/LocationContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <LocationProvider>
            <AppNavigator />
            <StatusBar style="auto" />
            <Toast />
          </LocationProvider>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
