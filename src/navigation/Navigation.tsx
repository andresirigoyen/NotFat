import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';

// Importaciones de Onboarding / Auth
import SplashScreen from '../screens/onboarding/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import OnboardingGenderScreen from '../screens/onboarding/OnboardingGenderScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Navegador Principal (Bottom Tabs + Hub)
import MainNavigator from './MainNavigator';
import AnalysisResultScreen from '../screens/main/AnalysisResultScreen';

const Stack = createStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
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

        {/* Análisis de imagen con IA */}
        <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} />

        {/* Sin gestura de regreso desde Main */}
        <Stack.Screen
          name="Main"
          component={MainNavigator}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

