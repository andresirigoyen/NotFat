import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_meal',
    title: 'Primera Comida',
    description: 'Registraste tu primera comida',
    icon: 'restaurant-outline',
    color: '#FCD34D',
    points: 10,
    unlocked: true,
    unlockedAt: '2024-01-15',
  },
  {
    id: 'week_streak',
    title: 'Semana Perfecta',
    description: 'Registraste comidas por 7 días seguidos',
    icon: 'flame-outline',
    color: '#F59E0B',
    points: 50,
    unlocked: true,
    unlockedAt: '2024-01-22',
  },
  {
    id: 'water_goal',
    title: 'Hidratado',
    description: 'Alcanzaste tu meta de agua por 7 días',
    icon: 'water-outline',
    color: '#38BDF8',
    points: 30,
    unlocked: true,
    unlockedAt: '2024-01-20',
  },
  {
    id: 'weight_goal',
    title: 'Meta de Peso',
    description: 'Alcanzaste tu peso objetivo',
    icon: 'scale-outline',
    color: '#34D399',
    points: 100,
    unlocked: false,
    progress: 80,
    maxProgress: 100,
  },
  {
    id: 'protein_champion',
    title: 'Campeón de Proteínas',
    description: 'Alcanzaste tu meta de proteínas 5 días seguidos',
    icon: 'fitness-outline',
    color: '#8B5CF6',
    points: 75,
    unlocked: false,
    progress: 3,
    maxProgress: 5,
  },
  {
    id: 'calorie_counter',
    title: 'Contador de Calorías',
    description: 'Registraste 1000 calorías totales',
    icon: 'analytics-outline',
    color: '#EF4444',
    points: 25,
    unlocked: false,
    progress: 750,
    maxProgress: 1000,
  },
  {
    id: 'recipe_master',
    title: 'Maestro de Recetas',
    description: 'Generaste 10 recetas con NotFat AI',
    icon: 'sparkles-outline',
    color: '#FCD34D',
    points: 60,
    unlocked: false,
    progress: 6,
    maxProgress: 10,
  },
  {
    id: 'early_bird',
    title: 'Madrugador',
    description: 'Registraste tu desayuno antes de las 7am por 5 días',
    icon: 'sunny-outline',
    color: '#F59E0B',
    points: 40,
    unlocked: false,
  },
  {
    id: 'consistency_king',
    title: 'Rey de la Consistencia',
    description: 'Usaste la app por 30 días seguidos',
    icon: 'crown-outline',
    color: '#FCD34D',
    points: 200,
    unlocked: false,
    progress: 15,
    maxProgress: 30,
  },
];

const LEVELS = [
  { level: 1, title: 'Principiante', minPoints: 0, color: '#94A3B8' },
  { level: 2, title: 'NutriNovato', minPoints: 100, color: '#60A5FA' },
  { level: 3, title: 'NutriIntermedio', minPoints: 300, color: '#34D399' },
  { level: 4, title: 'NutriExperto', minPoints: 600, color: '#F59E0B' },
  { level: 5, title: 'NutriMaestro', minPoints: 1000, color: '#FCD34D' },
  { level: 6, title: 'NutriLeyenda', minPoints: 2000, color: '#8B5CF6' },
];

export default function AchievementsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [userPoints, setUserPoints] = useState(285); // Simulado - vendría del backend

  const getCurrentLevel = () => {
    return LEVELS.reverse().find(level => userPoints >= level.minPoints) || LEVELS[0];
  };

  const getNextLevel = () => {
    const current = getCurrentLevel();
    const currentIndex = LEVELS.findIndex(l => l.level === current.level);
    return LEVELS[currentIndex + 1];
  };

  const filteredAchievements = ACHIEVEMENTS.filter(achievement => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'unlocked') return achievement.unlocked;
    if (selectedCategory === 'locked') return !achievement.unlocked;
    return true;
  });

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalPoints = ACHIEVEMENTS.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progressToNext = nextLevel 
    ? ((userPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Logros</Text>
        <Text style={styles.subtitle}>Tu progreso y recompensas</Text>
      </View>

      {/* User Level Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View>
            <Text style={styles.currentLevel}>Nivel {currentLevel.level}</Text>
            <Text style={styles.levelTitle}>{currentLevel.title}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsLabel}>Puntos</Text>
            <Text style={styles.pointsValue}>{userPoints}</Text>
          </View>
        </View>
        
        {nextLevel && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(progressToNext, 100)}%`, backgroundColor: nextLevel.color }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {userPoints}/{nextLevel.minPoints} pts para Nivel {nextLevel.level}
            </Text>
          </View>
        )}
      </View>

      {/* Category Selector */}
      <View style={styles.categorySelector}>
        {[
          { key: 'all', label: 'Todos', count: ACHIEVEMENTS.length },
          { key: 'unlocked', label: 'Desbloqueados', count: unlockedCount },
          { key: 'locked', label: 'Por desbloquear', count: ACHIEVEMENTS.length - unlockedCount },
        ].map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.key as any)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.key && styles.categoryButtonTextActive,
              ]}
            >
              {category.label} ({category.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Achievements Grid */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.achievementsGrid}
      >
        {filteredAchievements.map((achievement) => (
          <Animated.View
            key={achievement.id}
            style={[
              styles.achievementCard,
              !achievement.unlocked && styles.lockedCard,
            ]}
          >
            <View style={styles.achievementHeader}>
              <View style={[
                styles.iconContainer, 
                { backgroundColor: achievement.unlocked ? achievement.color + '20' : '#374151' }
              ]}>
                <Ionicons
                  name={achievement.icon as any}
                  size={24}
                  color={achievement.unlocked ? achievement.color : '#6B7280'}
                />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.lockedText,
                ]}>
                  {achievement.unlocked ? achievement.title : '???'}
                </Text>
                <Text style={styles.points}>+{achievement.points} pts</Text>
              </View>
              {achievement.unlocked && (
                <Ionicons name="checkmark-circle" size={20} color="#34D399" />
              )}
              {!achievement.unlocked && (
                <Ionicons name="lock-closed" size={20} color="#6B7280" />
              )}
            </View>
            
            <Text style={[
              styles.achievementDescription,
              !achievement.unlocked && styles.lockedText,
            ]}>
              {achievement.unlocked ? achievement.description : 'Completa más logros para desbloquear'}
            </Text>

            {/* Progress Bar for locked achievements */}
            {!achievement.unlocked && achievement.progress !== undefined && (
              <View style={styles.lockedProgress}>
                <View style={styles.lockedProgressBar}>
                  <View 
                    style={[
                      styles.lockedProgressFill,
                      { width: `${(achievement.progress! / achievement.maxProgress!) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.lockedProgressText}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            )}

            {achievement.unlocked && achievement.unlockedAt && (
              <Text style={styles.unlockedDate}>
                Desbloqueado el {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            )}
          </Animated.View>
        ))}
      </ScrollView>

      {/* Stats Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen de Logros</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{unlockedCount}</Text>
            <Text style={styles.summaryLabel}>Logros</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalPoints}</Text>
            <Text style={styles.summaryLabel}>Puntos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%
            </Text>
            <Text style={styles.summaryLabel}>Completado</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  levelCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  currentLevel: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  levelTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsLabel: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  pointsValue: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary.amber,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  categorySelector: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.background.secondary,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary.amber,
  },
  categoryButtonText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text.secondary,
  },
  categoryButtonTextActive: {
    color: COLORS.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  lockedCard: {
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
  points: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.amber,
    fontWeight: FONTS.weights.medium,
  },
  lockedText: {
    color: COLORS.text.secondary,
  },
  achievementDescription: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  lockedProgress: {
    marginTop: SPACING.sm,
  },
  lockedProgressBar: {
    height: 6,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  lockedProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.amber,
    borderRadius: 3,
  },
  lockedProgressText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  unlockedDate: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xs,
    color: '#34D399',
    marginTop: SPACING.xs,
  },
  summaryCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  summaryTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary.amber,
  },
  summaryLabel: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});
