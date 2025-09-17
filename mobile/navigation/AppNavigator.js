import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Main Screens
import TripsScreen from '../screens/Trips/TripsScreen';
import CreateTripScreen from '../screens/Trips/CreateTripScreen';
import TripDetailsScreen from '../screens/Trips/TripDetailsScreen';
import InviteMemberScreen from '../screens/Trips/InviteMemberScreen';

import ExpensesScreen from '../screens/Expenses/ExpensesScreen';
import AddExpenseScreen from '../screens/Expenses/AddExpenseScreen';
import ExpenseDetailsScreen from '../screens/Expenses/ExpenseDetailsScreen';
import ExpenseSummaryScreen from '../screens/Expenses/ExpenseSummaryScreen';

import MediaScreen from '../screens/Media/MediaScreen';
import UploadMediaScreen from '../screens/Media/UploadMediaScreen';

import ChatScreen from '../screens/Chat/ChatScreen';

import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';

import LocationTrackingScreen from '../screens/Trips/LocationTrackingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#fff' }
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Trips Stack Navigator
const TripsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="TripsList" 
      component={TripsScreen} 
      options={{ title: 'My Trips' }}
    />
    <Stack.Screen 
      name="CreateTrip" 
      component={CreateTripScreen} 
      options={{ title: 'Create Trip' }}
    />
    <Stack.Screen 
      name="TripDetails" 
      component={TripDetailsScreen} 
      options={{ title: 'Trip Details' }}
    />
    <Stack.Screen 
      name="InviteMember" 
      component={InviteMemberScreen} 
      options={{ title: 'Invite Member' }}
    />
    <Stack.Screen 
      name="LocationTracking" 
      component={LocationTrackingScreen} 
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Expenses Stack Navigator
const ExpensesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#4CAF50',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ExpensesList" 
      component={ExpensesScreen} 
      options={{ title: 'Expenses' }}
    />
    <Stack.Screen 
      name="AddExpense" 
      component={AddExpenseScreen} 
      options={{ title: 'Add Expense' }}
    />
    <Stack.Screen 
      name="ExpenseDetails" 
      component={ExpenseDetailsScreen} 
      options={{ title: 'Expense Details' }}
    />
    <Stack.Screen 
      name="ExpenseSummary" 
      component={ExpenseSummaryScreen} 
      options={{ title: 'Expense Summary' }}
    />
  </Stack.Navigator>
);

// Media Stack Navigator
const MediaStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FF9800',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="MediaList" 
      component={MediaScreen} 
      options={{ title: 'Media Gallery' }}
    />
    <Stack.Screen 
      name="UploadMedia" 
      component={UploadMediaScreen} 
      options={{ title: 'Upload Media' }}
    />
  </Stack.Navigator>
);

// Chat Stack Navigator
const ChatStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#9C27B0',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ChatList" 
      component={ChatScreen} 
      options={{ title: 'Chat' }}
    />
  </Stack.Navigator>
);

// Profile Stack Navigator
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#607D8B',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen} 
      options={{ title: 'Edit Profile' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Trips') {
          iconName = focused ? 'airplane' : 'airplane-outline';
        } else if (route.name === 'Expenses') {
          iconName = focused ? 'card' : 'card-outline';
        } else if (route.name === 'Media') {
          iconName = focused ? 'images' : 'images-outline';
        } else if (route.name === 'Chat') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2196F3',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Trips" component={TripsStack} />
    <Tab.Screen name="Expenses" component={ExpensesStack} />
    <Tab.Screen name="Media" component={MediaStack} />
    <Tab.Screen name="Chat" component={ChatStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can add a loading screen component here
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
