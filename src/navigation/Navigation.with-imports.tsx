import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';

const Stack = createStackNavigator();

function WelcomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF3ED' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#7c2d12', marginBottom: 10 }}>NotFat 🦦</Text>
      <Text style={{ fontSize: 18, color: '#a16207', textAlign: 'center' }}>Bienvenido a tu app de nutrición</Text>
    </View>
  );
}

function DashboardScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF3ED' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#7c2d12', marginBottom: 10 }}>Dashboard</Text>
      <Text style={{ fontSize: 16, color: '#a16207', textAlign: 'center' }}>Tu progreso nutricional</Text>
    </View>
  );
}

// Importar pantalla Gender con manejo de errores
let OnboardingGenderScreen;
try {
  OnboardingGenderScreen = require('@/screens/onboarding/OnboardingGenderScreen').default;
} catch (error) {
  console.log('OnboardingGenderScreen not available:', error);
  OnboardingGenderScreen = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF3ED' }}>
      <Text style={{ fontSize: 20, color: '#7c2d12' }}>Pantalla de Género</Text>
    </View>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="OnboardingGender" component={OnboardingGenderScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
