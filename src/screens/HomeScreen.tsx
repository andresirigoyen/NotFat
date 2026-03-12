import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useTodayMeals } from '@/hooks/useMeals';
import { useAddWater } from '@/hooks/useWaterLogs';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { profile, nutritionGoals, isLoading: profileLoading } = useProfile();
  const { data: totals, isLoading: totalsLoading } = useDailyTotals();
  const { data: todayMeals, isLoading: mealsLoading } = useTodayMeals(user?.id || '');
  const { mutate: addWater } = useAddWater();

  const getTodayWater = () => {
    if (!todayMeals) return 0;
    return todayMeals.reduce((acc: number, meal: any) => {
      return acc + (meal.water_volume || 0);
    }, 0);
  };

  const todayWater = getTodayWater();
  const todayTotals = totals || { calories: 0, protein: 0, carbs: 0, fat: 0, water: todayWater };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'camera':
        navigation.navigate('MealLogger' as never);
        break;
      case 'water':
        navigation.navigate('Hydration' as never);
        break;
      case 'progress':
        navigation.navigate('Progress' as never);
        break;
      case 'favorites':
        navigation.navigate('Favorites' as never);
        break;
      default:
        break;
    }
  };

  const handleAddWater = () => {
    addWater({ 
      volume: 250, 
      unit: 'ml',
      recorded_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      logged_at: new Date().toISOString()
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getProgressPercentage = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return COLORS.status.success;
    if (percentage >= 80) return COLORS.primary.amber;
    if (percentage >= 60) return COLORS.primary.sky;
    return COLORS.status.error;
  };

  if (profileLoading || totalsLoading || mealsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.sky} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.first_name?.split(' ')[0] || 'Usuario'}! 👋
          </Text>
          <Text style={styles.subtitle}>
            ¿Cómo vamos hoy con tus metas?
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.avatar}
          onPress={() => navigation.navigate('Profile' as never)}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={COLORS.text.secondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Cards */}
      <View style={styles.progressSection}>
        <View style={styles.progressCard}>
          <LinearGradient
            colors={[COLORS.primary.sky, '#0EA5E9']}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <Ionicons name="flame" size={24} color={COLORS.text.primary} />
              <Text style={styles.progressTitle}>Calorías</Text>
            </View>
            <Text style={styles.progressValue}>
              {Math.round(todayTotals.calories)} / {nutritionGoals?.calories || 2000}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${getProgressPercentage(todayTotals.calories, nutritionGoals?.calories || 2000)}%`,
                    backgroundColor: getProgressColor(getProgressPercentage(todayTotals.calories, nutritionGoals?.calories || 2000))
                  }
                ]} 
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.progressCard}>
          <LinearGradient
            colors={[COLORS.primary.amber, '#F59E0B']}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <Ionicons name="water" size={24} color={COLORS.text.primary} />
              <Text style={styles.progressTitle}>Agua</Text>
            </View>
            <Text style={styles.progressValue}>
              {Math.round(todayTotals.water)} / {profile?.preferred_bottle_size || 2000}ml
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${getProgressPercentage(todayTotals.water, profile?.preferred_bottle_size || 2000)}%`,
                    backgroundColor: getProgressColor(getProgressPercentage(todayTotals.water, profile?.preferred_bottle_size || 2000))
                  }
                ]} 
              />
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleQuickAction('camera')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: `${COLORS.primary.sky}20` }]}>
              <Ionicons name="camera" size={24} color={COLORS.primary.sky} />
            </View>
            <Text style={styles.actionText}>Escanear</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleQuickAction('water')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: `${COLORS.primary.amber}20` }]}>
              <Ionicons name="water" size={24} color={COLORS.primary.amber} />
            </View>
            <Text style={styles.actionText}>Agua</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleQuickAction('progress')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: `${COLORS.status.success}20` }]}>
              <Ionicons name="bar-chart" size={24} color={COLORS.status.success} />
            </View>
            <Text style={styles.actionText}>Progreso</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleQuickAction('favorites')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: `${COLORS.status.info}20` }]}>
              <Ionicons name="heart" size={24} color={COLORS.status.info} />
            </View>
            <Text style={styles.actionText}>Favoritos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Meals */}
      <View style={styles.mealsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Comidas de Hoy</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MealLogger' as never)}>
            <Ionicons name="add-circle" size={24} color={COLORS.primary.sky} />
          </TouchableOpacity>
        </View>
        
        {todayMeals && todayMeals.length > 0 ? (
          todayMeals.slice(0, 3).map((meal: any, index: number) => (
            <TouchableOpacity 
              key={meal.id} 
              style={styles.mealItem}
              onPress={() => navigation.navigate('MealLogger' as never)}
            >
              <View style={styles.mealContent}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>
                  {new Date(meal.meal_at).toLocaleTimeString('es-CL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                <View style={styles.mealMacros}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{Math.round(meal.calories || 0)}</Text>
                    <Text style={styles.macroLabel}>cal</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{Math.round(meal.protein || 0)}g</Text>
                    <Text style={styles.macroLabel}>prot</Text>
                  </View>
                </View>
              </View>
              {meal.image_url && (
                <Image source={{ uri: meal.image_url }} style={styles.mealImage} />
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyMeals}>
            <Ionicons name="restaurant" size={48} color={COLORS.text.muted} />
            <Text style={styles.emptyMealsText}>No hay comidas registradas hoy</Text>
            <TouchableOpacity 
              style={styles.addMealButton}
              onPress={() => navigation.navigate('MealLogger' as never)}
            >
              <Text style={styles.addMealButtonText}>Agregar Comida</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Add Water */}
      <TouchableOpacity style={styles.quickAddWater} onPress={handleAddWater}>
        <Ionicons name="water" size={20} color={COLORS.text.primary} />
        <Text style={styles.quickAddWaterText}>+250ml Agua</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.border,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  progressSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  progressCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  progressGradient: {
    padding: SPACING.md,
    height: 120,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.xs,
  },
  progressValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickActions: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  mealsSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  mealItem: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  mealContent: {
    flex: 1,
  },
  mealName: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  mealTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  macroLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    textTransform: 'uppercase',
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.md,
  },
  emptyMeals: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  emptyMealsText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  addMealButton: {
    backgroundColor: COLORS.primary.sky,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  addMealButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  quickAddWater: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.sky,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  quickAddWaterText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.sm,
  },
});
