import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useOnboardingStore } from '@/store/onboarding-store';
import { analytics } from '@/services/analytics';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const DIET_TYPES = [
  { id: 'balanced', label: 'Balanceada', description: 'Equilibrada y variada', icon: 'restaurant' as const },
  { id: 'vegetarian', label: 'Vegetariana', description: 'Sin carne, con lácteos/huevos', icon: 'leaf' as const },
  { id: 'vegan', label: 'Vegana', description: 'Sin origen animal', icon: 'flower' as const },
  { id: 'keto', label: 'Keto', description: 'Baja en carbs, alta en grasa', icon: 'flame' as const },
  { id: 'paleo', label: 'Paleo', description: 'Alimentos no procesados', icon: 'nutrition' as const },
  { id: 'mediterranean', label: 'Mediterránea', description: 'Dieta mediterránea', icon: 'sunny' as const },
];

const NUTRITION_GOALS = [
  {
    id: 'lose_weight',
    label: 'Perder Peso',
    icon: 'trending-down' as const,
    description: 'Reducir grasa de forma saludable',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80',
  },
  {
    id: 'maintain_weight',
    label: 'Mantener Peso',
    icon: 'remove' as const,
    description: 'Mantener equilibrio y salud',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80',
  },
  {
    id: 'gain_muscle',
    label: 'Ganar Músculo',
    icon: 'trending-up' as const,
    description: 'Aumentar masa y fuerza',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80',
  },
  {
    id: 'improve_health',
    label: 'Mejorar Salud',
    icon: 'heart' as const,
    description: 'Hábitos y bienestar general',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&q=80',
  },
];

export default function OnboardingGoalsScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  
  const [selectedGoal, setSelectedGoal] = useState<string>(onboardingData.nutrition_goal || '');
  const [selectedDiet, setSelectedDiet] = useState<string>(onboardingData.diet_type || 'balanced');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingGoals' });
  }, [setOnboardingData]);

  const handleContinue = async () => {
    if (!selectedGoal || isLoading) return;
    setIsLoading(true);
    try {
      if (user) {
        await updateProfile.mutateAsync({
          nutrition_goal: selectedGoal,
          goal: selectedGoal,
          diet_type: selectedDiet,
          onboarding_step: 'allergies',
        });
      } else {
        setOnboardingData({
          nutrition_goal: selectedGoal,
          diet_type: selectedDiet,
        });
      }

      analytics.trackOnboardingStep('goals', {
        nutrition_goal: selectedGoal,
        diet_type: selectedDiet,
      });

      navigation.navigate('OnboardingAllergies' as never);
    } catch (e) {
      console.error('[Onboarding] Error saving goals:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.progressWrapper}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: '45%' }]} />
          </View>
          <Text style={styles.progressLabel}>PASO 4 DE 10</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.titleSection}>
          <Text style={styles.title}>¿Cuáles son tus metas?</Text>
          <Text style={styles.subtitle}>
            Personalizamos tu experiencia según tus objetivos y preferencias alimenticias.
          </Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objetivo Principal</Text>
          <View style={styles.goalsGrid}>
            {NUTRITION_GOALS.map((goal, index) => {
              const isActive = selectedGoal === goal.id;
              return (
                <Animated.View 
                  key={goal.id} 
                  entering={FadeInUp.delay(index * 100).duration(800)}
                >
                  <TouchableOpacity
                    style={[styles.goalCard, isActive && styles.goalCardActive]}
                    onPress={() => setSelectedGoal(goal.id)}
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={{ uri: goal.image }}
                      style={styles.goalImage}
                      imageStyle={styles.goalImageImg}
                    >
                      <LinearGradient
                        colors={isActive ? ['rgba(0,0,0,0.1)', 'rgba(251, 191, 36, 0.9)'] : ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                        style={styles.goalGradient}
                      >
                        <Ionicons 
                          name={goal.icon} 
                          size={24} 
                          color={isActive ? '#000' : '#FFF'} 
                        />
                        <View>
                          <Text style={[styles.goalLabel, isActive && styles.goalLabelActive]}>
                            {goal.label}
                          </Text>
                          <Text style={[styles.goalDesc, isActive && styles.goalDescActive]}>
                            {goal.description}
                          </Text>
                        </View>
                        {isActive && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#000" />
                          </View>
                        )}
                      </LinearGradient>
                    </ImageBackground>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Dieta</Text>
          <View style={styles.dietGrid}>
            {DIET_TYPES.map((diet) => {
              const isActive = selectedDiet === diet.id;
              return (
                <TouchableOpacity
                  key={diet.id}
                  style={[styles.dietCard, isActive && styles.dietCardActive]}
                  onPress={() => setSelectedDiet(diet.id)}
                >
                  <View style={[styles.dietIconBox, isActive && styles.dietIconBoxActive]}>
                    <Ionicons name={diet.icon} size={20} color={isActive ? '#000' : '#6B7280'} />
                  </View>
                  <Text style={[styles.dietLabel, isActive && styles.dietLabelActive]}>
                    {diet.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.continueButton, (!selectedGoal || isLoading) && styles.buttonDisabled]} 
          onPress={handleContinue}
          disabled={!selectedGoal || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Siguiente</Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    height: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrapper: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#111',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FBBF24',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: FONTS.primary,
    lineHeight: 24,
  },
  section: {
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  },
  goalsGrid: {
    gap: SPACING.md,
  },
  goalCard: {
    height: 100,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  goalCardActive: {
    borderColor: '#FBBF24',
  },
  goalImage: {
    flex: 1,
  },
  goalImageImg: {
    opacity: 0.5,
  },
  goalGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  goalLabelActive: {
    color: '#000',
  },
  goalDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  goalDescActive: {
    color: '#000',
    opacity: 0.8,
  },
  checkBadge: {
    position: 'absolute',
    right: SPACING.md,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dietCard: {
    width: '48%',
    backgroundColor: '#0A0A0A',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dietCardActive: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  dietIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dietIconBoxActive: {
    backgroundColor: '#FBBF24',
  },
  dietLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  dietLabelActive: {
    color: '#FFF',
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  continueButton: {
    height: 64,
    backgroundColor: '#FBBF24',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
});
