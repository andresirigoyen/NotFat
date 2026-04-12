import React, { Suspense } from 'react';
import { Linking, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TransitionPresets, createStackNavigator } from '@react-navigation/stack';
import { deepLinkingService } from '@/services/deeplinking';

// Importaciones Críticas (Directas para FCP)
import SplashScreen from '../screens/onboarding/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';

// Wrapper para Lazy Loading con Suspense funcional en Web
const LazyOverlay = (Component: any) => (props: any) => (
  <Suspense fallback={
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FBBF24" />
    </View>
  }>
    <Component {...props} />
  </Suspense>
);

// Importaciones Diferidas (Lazy Loading)
const OnboardingReferralScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingReferralScreen')));
const OnboardingNameScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingNameScreen')));
const OnboardingGenderScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingGenderScreen')));
const OnboardingBirthDateScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingBirthDateScreen')));
const OnboardingGoalsScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingGoalsScreen')));
const OnboardingProfileScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingProfileScreen')));
const OnboardingActivityScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingActivityScreen')));
const OnboardingPreferencesScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingPreferencesScreen')));
const OnboardingAIGoalsScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingAIGoalsScreen')));
const OnboardingModeSelectionScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingModeSelectionScreen')));
const OnboardingPsychologyScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingPsychologyScreen')));
const OnboardingGeneratingPlanScreen = LazyOverlay(React.lazy(() => import('../screens/onboarding/OnboardingGeneratingPlanScreen')));
const LoginScreen = LazyOverlay(React.lazy(() => import('../screens/auth/LoginScreen')));
const SignUpScreen = LazyOverlay(React.lazy(() => import('../screens/auth/SignUpScreen')));
const MainNavigator = LazyOverlay(React.lazy(() => import('./MainNavigator')));
const BarcodeScannerScreen = LazyOverlay(React.lazy(() => import('../screens/main/BarcodeScannerScreen')));
const SubscriptionCenterScreen = LazyOverlay(React.lazy(() => import('../screens/main/SubscriptionCenterScreen')));
const SubscriptionScreen = LazyOverlay(React.lazy(() => import('../screens/main/SubscriptionScreen')));
const RecipeDetailScreen = LazyOverlay(React.lazy(() => import('../screens/main/RecipeDetailScreen')));

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
        <Stack.Screen name="OnboardingReferral" component={OnboardingReferralScreen} />
        <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
        <Stack.Screen name="OnboardingGender" component={OnboardingGenderScreen} />
        <Stack.Screen name="OnboardingBirthDate" component={OnboardingBirthDateScreen} />
        <Stack.Screen name="OnboardingGoals" component={OnboardingGoalsScreen} />
        <Stack.Screen name="OnboardingAIGoals" component={OnboardingAIGoalsScreen} />
        <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
        <Stack.Screen name="OnboardingActivity" component={OnboardingActivityScreen} />
        <Stack.Screen name="OnboardingPreferences" component={OnboardingPreferencesScreen} />
        <Stack.Screen name="OnboardingPsychology" component={OnboardingPsychologyScreen} />
        <Stack.Screen name="OnboardingModeSelection" component={OnboardingModeSelectionScreen} />
        <Stack.Screen name="OnboardingGeneratingPlan" component={OnboardingGeneratingPlanScreen} />

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

