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

  // Watch for Auth state changes to handle transitions (Login or Logout)
  React.useEffect(() => {
    console.log('[Navigation] Auth state changed - loading:', loading, 'user:', user?.id ? 'LOGGED_IN' : 'LOGGED_OUT');
    
    if (loading) return;

    if (!user) {
      // HANDLE LOGOUT: Redirect to Welcome only if not already on Splash/Welcome/Login/SignUp
      const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
      if (currentRoute && !['Welcome', 'Splash', 'Login', 'SignUp'].includes(currentRoute)) {
        console.log('[Navigation] Redirecting to Welcome on logout');
        (navigationRef.current as any).reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    } else {
      // HANDLE LOGIN: Redirect to Splash to determine next onboarding step or Main Dashboard
      const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
      if (currentRoute && ['Welcome', 'Login', 'SignUp'].includes(currentRoute)) {
        console.log('[Navigation] New session detected, redirecting to Splash for routing');
        (navigationRef.current as any).reset({
          index: 0,
          routes: [{ name: 'Splash' }],
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

