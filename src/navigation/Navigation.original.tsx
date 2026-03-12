import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useAuthStore } from '@/store';
import { useOnboardingStore } from '@/store/onboarding';
import { CustomTabBar } from './CustomTabBar';

// Screens
import WelcomeScreen from '@/screens/onboarding/WelcomeScreen';
import OnboardingGenderScreen from '@/screens/onboarding/OnboardingGenderScreen';
import OnboardingBirthDateScreen from '@/screens/onboarding/OnboardingBirthDateScreen';
import OnboardingGoalsScreen from '@/screens/onboarding/OnboardingGoalsScreen';
import OnboardingProfileScreen from '@/screens/onboarding/OnboardingProfileScreen';
import OnboardingActivityScreen from '@/screens/onboarding/OnboardingActivityScreen';
import OnboardingAIGoalsScreen from '@/screens/onboarding/OnboardingAIGoalsScreen';
import OnboardingPreferencesScreen from '@/screens/onboarding/OnboardingPreferencesScreen';
import DashboardScreen from '@/screens/main/DashboardScreen';
import ProgressScreen from '@/screens/main/ProgressScreen';
import NoFatScreen from '@/screens/main/NoFatScreen';
import ProfileScreen from '@/screens/main/ProfileScreen';
import EditProfileScreen from '@/screens/main/EditProfileScreen';
import MealLoggerScreen from '@/screens/main/MealLoggerScreen';
import MealTimeScreen from '@/screens/main/MealTimeScreen';
import AnalysisResultScreen from '@/screens/main/AnalysisResultScreen';
import SubscriptionScreen from '@/screens/main/SubscriptionScreen';
import BarcodeScannerScreen from '@/screens/main/BarcodeScannerScreen';
import PreferencesScreen from '@/screens/main/PreferencesScreen';
import ProfileSetupScreen from '@/screens/main/ProfileSetupScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
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
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="OnboardingGender" component={OnboardingGenderScreen} />
            <Stack.Screen name="OnboardingBirthDate" component={OnboardingBirthDateScreen} />
            <Stack.Screen name="OnboardingGoals" component={OnboardingGoalsScreen} />
            <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
            <Stack.Screen name="OnboardingActivity" component={OnboardingActivityScreen} />
            <Stack.Screen name="OnboardingAIGoals" component={OnboardingAIGoalsScreen} />
            <Stack.Screen name="OnboardingPreferences" component={OnboardingPreferencesScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="Preferences" component={PreferencesScreen} />
            <Stack.Screen name="MealLogger" component={MealLoggerScreen} />
            <Stack.Screen name="MealTime" component={MealTimeScreen} />
            <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} />
            <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
