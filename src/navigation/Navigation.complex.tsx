import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

// Importaciones con manejo de errores
let useAuthStore, useOnboardingStore, CustomTabBar;
let WelcomeScreen, DashboardScreen, ProgressScreen, NoFatScreen, ProfileScreen;

try {
  useAuthStore = require('@/store').useAuthStore;
} catch (error) {
  console.log('useAuthStore not available:', error);
  useAuthStore = () => ({ user: null, loading: false });
}

try {
  useOnboardingStore = require('@/store/onboarding').useOnboardingStore;
} catch (error) {
  console.log('useOnboardingStore not available:', error);
  useOnboardingStore = () => ({ isOnboardingComplete: false });
}

try {
  CustomTabBar = require('./CustomTabBar').default;
} catch (error) {
  console.log('CustomTabBar not available:', error);
  CustomTabBar = () => null;
}

// Screens con fallbacks
try {
  WelcomeScreen = require('@/screens/onboarding/WelcomeScreen').default;
} catch (error) {
  console.log('WelcomeScreen not available:', error);
  WelcomeScreen = () => <View><Text>Welcome Screen</Text></View>;
}

try {
  DashboardScreen = require('@/screens/main/DashboardScreen').default;
} catch (error) {
  console.log('DashboardScreen not available:', error);
  DashboardScreen = () => <View><Text>Dashboard</Text></View>;
}

try {
  ProgressScreen = require('@/screens/main/ProgressScreen').default;
} catch (error) {
  console.log('ProgressScreen not available:', error);
  ProgressScreen = () => <View><Text>Progress</Text></View>;
}

try {
  NoFatScreen = require('@/screens/main/NoFatScreen').default;
} catch (error) {
  console.log('NoFatScreen not available:', error);
  NoFatScreen = () => <View><Text>NoFat</Text></View>;
}

try {
  ProfileScreen = require('@/screens/main/ProfileScreen').default;
} catch (error) {
  console.log('ProfileScreen not available:', error);
  ProfileScreen = () => <View><Text>Profile</Text></View>;
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => CustomTabBar ? <CustomTabBar {...props} /> : null}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="NoFat" component={NoFatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuthStore();
  const { isOnboardingComplete } = useOnboardingStore();
  const isOnboarded = user?.onboarding_completed ?? isOnboardingComplete;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF3ED' }}>
        <Text style={{ marginTop: 20, color: '#7c2d12', fontWeight: '900', fontSize: 18 }}>nutrIA 🦦</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
