import React from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { deepLinkingService } from '@/services/deeplinking';

// Importaciones de Onboarding / Auth
import SplashScreen from '../screens/onboarding/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import OnboardingGenderScreen from '../screens/onboarding/OnboardingGenderScreen';
import OnboardingBirthDateScreen from '../screens/onboarding/OnboardingBirthDateScreen';
import OnboardingGoalsScreen from '../screens/onboarding/OnboardingGoalsScreen';
import OnboardingProfileScreen from '../screens/onboarding/OnboardingProfileScreen';
import OnboardingActivityScreen from '../screens/onboarding/OnboardingActivityScreen';
import OnboardingPreferencesScreen from '../screens/onboarding/OnboardingPreferencesScreen';
import OnboardingAIGoalsScreen from '../screens/onboarding/OnboardingAIGoalsScreen';
import OnboardingModeSelectionScreen from '../screens/onboarding/OnboardingModeSelectionScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Navegador Principal (Bottom Tabs + Hub)
import MainNavigator from './MainNavigator';

// Pantallas principales que NO deben tener TabBar
import BarcodeScannerScreen from '../screens/main/BarcodeScannerScreen';
import SubscriptionCenterScreen from '../screens/main/SubscriptionCenterScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import RecipeDetailScreen from '../screens/main/RecipeDetailScreen';

// Pantallas que SÍ deben tener TabBar (se moverán dentro del MainNavigator)
// Estas pantallas ahora están manejadas dentro del MainNavigator

const Stack = createStackNavigator();

import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';

export default function Navigation() {
  const navigationRef = React.useRef<any>(null);
  const { user, loading } = useAuthStore();
  const { profile } = useProfile();

  // Watch for Auth state changes to handle logout or login transitions
  React.useEffect(() => {
    console.log('[Navigation] Auth effect - loading:', loading, 'user:', user ? 'exists' : 'null');
    if (!loading && !user && navigationRef.current) {
      // Ensure we are not on Splash or Welcome already to avoid loops
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      console.log('[Navigation] Current route:', currentRoute);
      if (currentRoute !== 'Welcome' && currentRoute !== 'Splash' && currentRoute !== 'Login' && currentRoute !== 'SignUp') {
        console.log('[Navigation] User logged out, redirecting to Welcome');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    }
  }, [user, loading]);

  React.useEffect(() => {
    // Initial URL
    Linking.getInitialURL()
      .then((url) => {
        if (url && deepLinkingService.canHandleUrl(url)) {
          deepLinkingService.handleUrl(url);
        }
      })
      .catch(() => {});

    // Runtime URL events
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url && deepLinkingService.canHandleUrl(url)) {
        deepLinkingService.handleUrl(url);
      }
    });

    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer
      ref={(ref) => {
        navigationRef.current = ref;
        if (ref) deepLinkingService.setNavigationRef(ref);
      }}
    >
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          ...TransitionPresets.SlideFromRightIOS,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ ...TransitionPresets.FadeFromBottomAndroid }}
        />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="OnboardingGender" component={OnboardingGenderScreen} />
        <Stack.Screen name="OnboardingBirthDate" component={OnboardingBirthDateScreen} />
        <Stack.Screen name="OnboardingGoals" component={OnboardingGoalsScreen} />
        <Stack.Screen name="OnboardingAIGoals" component={OnboardingAIGoalsScreen} />
        <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
        <Stack.Screen name="OnboardingActivity" component={OnboardingActivityScreen} />
        <Stack.Screen name="OnboardingPreferences" component={OnboardingPreferencesScreen} />
        <Stack.Screen name="OnboardingModeSelection" component={OnboardingModeSelectionScreen} />

        {/* Pantallas SIN TabBar */}
        <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
        <Stack.Screen name="SubscriptionCenter" component={SubscriptionCenterScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />

        {/* Navegador Principal con TabBar */}
        <Stack.Screen
          name="Main"
          component={MainNavigator}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

