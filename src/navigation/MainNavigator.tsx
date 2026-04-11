import React, { useState, lazy, Suspense } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/main/DashboardScreen';
import CoachScreen from '../screens/main/CoachScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import HubModal from '../components/HubModal';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

const AnalysisResultScreen = lazy(() => import('../screens/main/AnalysisResultScreen'));
const EditFavoriteScreen = lazy(() => import('../screens/main/EditFavoriteScreen'));
const EditProfileScreen = lazy(() => import('../screens/main/EditProfileScreen'));
const FavoritesScreen = lazy(() => import('../screens/main/FavoritesScreen'));
const HydrationScreen = lazy(() => import('../screens/main/HydrationScreen'));
const MealLoggerScreen = lazy(() => import('../screens/main/MealLoggerScreen'));
const MealTimeScreen = lazy(() => import('../screens/main/MealTimeScreen'));
const PreferencesScreen = lazy(() => import('../screens/main/PreferencesScreen'));
const ProfileSetupScreen = lazy(() => import('../screens/main/ProfileSetupScreen'));
const ProgressScreen = lazy(() => import('../screens/main/ProgressScreen'));
const ScientificGoalsScreen = lazy(() => import('../screens/main/ScientificGoalsScreen'));
const StatsScreen = lazy(() => import('../screens/main/StatsScreen'));
const AchievementsScreen = lazy(() => import('../screens/main/AchievementsScreen'));
const HealthIntegrationScreen = lazy(() => import('../screens/main/HealthIntegrationScreen'));
const ProfessionalServicesScreen = lazy(() => import('../screens/main/ProfessionalServicesScreen'));
const CustomTimeMealScreen = lazy(() => import('../screens/main/CustomTimeMealScreen'));
const NutritionGuidelinesScreen = lazy(() => import('../screens/main/NutritionGuidelinesScreen'));
const NutritionistsScreen = lazy(() => import('../screens/main/NutritionistsScreen'));
const RecipesScreen = lazy(() => import('../screens/main/RecipesScreen'));
const WorkoutsScreen = lazy(() => import('../screens/main/WorkoutsScreen'));
const VoiceInputScreen = lazy(() => import('../screens/main/VoiceInputScreen'));
const NoFatScreen = lazy(() => import('../screens/main/NoFatScreen'));
const SubscriptionCenterScreen = lazy(() => import('../screens/main/SubscriptionCenterScreen'));
const StepsScreen = lazy(() => import('../screens/main/StepsScreen'));
const NutritionPlanDetailScreen = lazy(() => import('../screens/main/NutritionPlanDetailScreen'));
const NutritionPlanEditScreen = lazy(() => import('../screens/main/NutritionPlanEditScreen'));

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: '#0D0D0D',
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    height: 72,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    overflow: 'visible',
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
    borderColor: '#0D0D0D',
  },
});

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

function MainStackNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        transitionSpec: {
          open: {
            animation: 'spring',
            config: {
              stiffness: 1000,
              damping: 50,
              mass: 3,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          },
          close: {
            animation: 'spring',
            config: {
              stiffness: 1000,
              damping: 50,
              mass: 3,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          },
        },
      }}
    >
      <Stack.Screen name="DashboardTab" component={DashboardScreen} />
      <Stack.Screen name="CoachTab" component={CoachScreen} />
      <Stack.Screen name="ProfileTab" component={ProfileScreen} />
      <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} options={{ cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid }} />
      <Stack.Screen name="MealLogger" component={MealLoggerScreen} options={{ cardStyleInterpolator: CardStyleInterpolators.forModalPresentationIOS }} />
      <Stack.Screen name="MealTime" component={MealTimeScreen} />
      <Stack.Screen name="CustomTimeMeal" component={CustomTimeMealScreen} />
      <Stack.Screen name="Hydration" component={HydrationScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="EditFavorite" component={EditFavoriteScreen} />
      <Stack.Screen name="ScientificGoals" component={ScientificGoalsScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="HealthIntegration" component={HealthIntegrationScreen} />
      <Stack.Screen name="ProfessionalServices" component={ProfessionalServicesScreen} />
      <Stack.Screen name="NutritionGuidelines" component={NutritionGuidelinesScreen} />
      <Stack.Screen name="Nutritionists" component={NutritionistsScreen} />
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="Workouts" component={WorkoutsScreen} />
      <Stack.Screen name="VoiceInput" component={VoiceInputScreen} />
      <Stack.Screen name="NoFat" component={NoFatScreen} />
      <Stack.Screen name="Pro" component={SubscriptionCenterScreen} />
      <Stack.Screen name="Steps" component={StepsScreen} />
      <Stack.Screen name="NutritionPlanDetail" component={NutritionPlanDetailScreen} />
      <Stack.Screen name="NutritionPlanEdit" component={NutritionPlanEditScreen} />
    </Stack.Navigator>
  );
}

const LoadingFallback = () => (
  <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator color={COLORS.primary.amber} size="large" />
  </View>
);

export default function MainNavigator() {
  const [hubVisible, setHubVisible] = useState(false);

  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
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
            component={MainStackNavigator}
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
            component={SubscriptionCenterScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} />,
              tabBarLabel: 'Pro',
            }}
          />
        </Tab.Navigator>
      </Suspense>

      <HubModal visible={hubVisible} onClose={() => setHubVisible(false)} />
    </>
  );
}