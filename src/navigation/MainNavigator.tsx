import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/main/DashboardScreen';
import CoachScreen from '../screens/main/CoachScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import HubModal from '../components/HubModal';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

const Tab = createBottomTabNavigator();

function ProfileScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background.primary, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="person-circle-outline" size={80} color={COLORS.text.secondary} />
      <Text style={{ color: COLORS.text.secondary, fontFamily: FONTS.primary, fontSize: 16, marginTop: SPACING.md }}>
        Perfil próximamente
      </Text>
    </View>
  );
}

function AddPlaceholder() {
  return null;
}

function TabBarAddButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={fabStyles.button} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name="camera" size={32} color={COLORS.background.primary} />
    </TouchableOpacity>
  );
}

export default function MainNavigator() {
  const [hubVisible, setHubVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: tabStyles.bar,
          tabBarActiveTintColor: COLORS.primary.amber,
          tabBarInactiveTintColor: '#555555',
          tabBarLabelStyle: tabStyles.label,
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
            tabBarLabel: 'Inicio',
          }}
        />
        <Tab.Screen
          name="Coach"
          component={CoachScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
            tabBarLabel: 'NotFat',
          }}
        />
        <Tab.Screen
          name="Add"
          component={AddPlaceholder}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => null,
            tabBarButton: () => <TabBarAddButton onPress={() => setHubVisible(true)} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
            tabBarLabel: 'Mi Perfil',
          }}
        />
        <Tab.Screen
          name="Pro"
          component={SubscriptionScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} />,
            tabBarLabel: 'Pro',
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tab.Navigator>

      <HubModal visible={hubVisible} onClose={() => setHubVisible(false)} />
    </>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: '#0D0D0D',
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    overflow: 'visible', // Ensure protruding button isn't clipped
  },
  label: {
    fontFamily: FONTS.primary,
    fontSize: 11,
    marginTop: 2,
  },
});

const fabStyles = StyleSheet.create({
  button: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary.amber,
    justifyContent: 'center',
    alignItems: 'center',
    top: -14,
    shadowColor: COLORS.primary.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#0D0D0D', // Match tab bar background for a seamless "cut" look
  },
});
