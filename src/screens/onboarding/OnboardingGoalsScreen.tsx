import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
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

const DIET_TYPES = [
  {
    id: 'balanced',
    label: 'Balanceada',
    description: 'Dieta equilibrada y variada',
    icon: 'restaurant' as keyof typeof Ionicons.glyphMap,
  },
  {
    id: 'vegetarian',
    label: 'Vegetariana',
    description: 'Sin carne pero con lácteos y huevos',
    icon: 'leaf' as keyof typeof Ionicons.glyphMap,
  },
  {
    id: 'vegan',
    label: 'Vegana',
    description: 'Sin productos de origen animal',
    icon: 'flower' as keyof typeof Ionicons.glyphMap,
  },
  {
    id: 'keto',
    label: 'Keto',
    description: 'Baja en carbohidratos, alta en grasas',
    icon: 'flame' as keyof typeof Ionicons.glyphMap,
  },
  {
    id: 'paleo',
    label: 'Paleo',
    description: 'Alimentos no procesados',
    icon: 'nutrition' as keyof typeof Ionicons.glyphMap,
  },
  {
    id: 'mediterranean',
    label: 'Mediterránea',
    description: 'Basada en dieta mediterránea',
    icon: 'sunny' as keyof typeof Ionicons.glyphMap,
  },
];

export default function OnboardingGoalsScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const NUTRITION_GOALS = React.useMemo(() => [
    {
      id: 'lose_weight',
      label: 'Perder Peso',
      icon: 'trending-down' as keyof typeof Ionicons.glyphMap,
      description: 'Reducir grasa corporal de forma saludable',
      color: '#FBBF24',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    },
    {
      id: 'maintain_weight',
      label: 'Mantener Peso',
      icon: 'remove' as keyof typeof Ionicons.glyphMap,
      description: 'Mantener peso actual saludable',
      color: '#FBBF24',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    },
    {
      id: 'gain_muscle',
      label: 'Ganar Músculo',
      icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
      description: 'Aumentar masa muscular y fuerza',
      color: '#FBBF24',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    },
    {
      id: 'improve_health',
      label: 'Mejorar Salud',
      icon: 'heart' as keyof typeof Ionicons.glyphMap,
      description: 'Mejorar hábitos y bienestar general',
      color: '#FBBF24',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    },
  ], []);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const { setData: setOnboardingData } = useOnboardingStore();
  const [selectedNutritionGoal, setSelectedNutritionGoal] = useState<string>('');
  const [selectedDietType, setSelectedDietType] = useState<string>('balanced');
  const [isLoading, setIsLoading] = useState(false);

  const handleNutritionGoalSelect = (goalId: string) => {
    setSelectedNutritionGoal(goalId);
  };

  const handleDietTypeSelect = (dietId: string) => {
    setSelectedDietType(dietId);
  };

  const persistGoals = async () => {
    if (!selectedNutritionGoal) return;

    if (user) {
      await updateProfile.mutateAsync({
        nutrition_goal: selectedNutritionGoal,
        goal: selectedNutritionGoal,
        diet_type: selectedDietType,
        onboarding_step: 'profile',
      });
    } else {
      setOnboardingData({
        nutrition_goal: selectedNutritionGoal,
        diet_type: selectedDietType,
      });
    }

    analytics.trackOnboardingStep('goals', {
      nutrition_goal: selectedNutritionGoal,
      diet_type: selectedDietType,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.progressWrapper}>
             <View style={styles.progressBackground}>
               <View style={[styles.progressBar, { width: '50%' }]} />
             </View>
             <Text style={styles.progressLabel}>PASO 5 DE 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>¿Cuáles son tus metas?</Text>
            <Text style={styles.subtitle}>
              Personalizamos tu experiencia según tus objetivos y preferencias.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu Objetivo Principal</Text>
            <View style={styles.goalsContainer}>
              {NUTRITION_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedNutritionGoal === goal.id && styles.goalCardSelected,
                  ]}
                  onPress={() => handleNutritionGoalSelect(goal.id)}
                  disabled={isLoading}
                >
                  <ImageBackground
                    source={{ uri: goal.image }}
                    style={styles.goalImageBackground}
                    imageStyle={styles.goalImageStyle}
                  >
                    <LinearGradient
                      colors={
                        selectedNutritionGoal === goal.id 
                          ? ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']
                          : ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
                      }
                      style={styles.goalImageGradient}
                    >
                      <View style={styles.goalContent}>
                        <View style={[
                          styles.goalIconContainer,
                          { backgroundColor: selectedNutritionGoal === goal.id ? '#FBBF24' : 'rgba(255, 255, 255, 0.1)' }
                        ]}>
                          <Ionicons 
                            name={goal.icon} 
                            size={24} 
                            color={selectedNutritionGoal === goal.id ? '#000' : '#FFF'} 
                          />
                        </View>
                        <View>
                          <Text style={styles.goalLabelText}>{goal.label}</Text>
                          <Text style={styles.goalDescriptionText}>{goal.description}</Text>
                        </View>
                        {selectedNutritionGoal === goal.id && (
                          <View style={styles.goalCheck}>
                            <Ionicons name="checkmark-circle" size={24} color="#FBBF24" />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Dieta</Text>
            <View style={styles.dietGrid}>
              {DIET_TYPES.map((diet) => (
                <TouchableOpacity
                  key={diet.id}
                  style={[
                    styles.dietCard,
                    selectedDietType === diet.id && styles.dietCardSelected,
                  ]}
                  onPress={() => handleDietTypeSelect(diet.id)}
                  disabled={isLoading}
                >
                  <View style={[
                    styles.dietIconContainer,
                    { backgroundColor: selectedDietType === diet.id ? '#FBBF24' : '#1A1A1A' }
                  ]}>
                    <Ionicons 
                      name={diet.icon} 
                      size={20} 
                      color={selectedDietType === diet.id ? '#000' : '#6B7280'} 
                    />
                  </View>
                  <Text style={[
                    styles.dietLabel,
                    selectedDietType === diet.id && styles.dietLabelSelected
                  ]}>
                    {diet.label}
                  </Text>
                  {selectedDietType === diet.id && (
                    <View style={styles.dietCheck}>
                      <Ionicons name="checkmark-circle" size={16} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.privacyCard}>
            <Ionicons name="lock-closed" size={16} color="#FBBF24" />
            <Text style={styles.privacyText}>
              Usamos tus preferencias para optimizar tus macros y recomendaciones.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedNutritionGoal && styles.continueButtonDisabled
            ]}
            onPress={async () => {
              if (!selectedNutritionGoal || isLoading) return;
              setIsLoading(true);
              try {
                await persistGoals();
                navigation.navigate('OnboardingProfile' as never);
              } catch (e) {
                console.error('Error saving goals:', e);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={!selectedNutritionGoal || isLoading}
          >
            <LinearGradient
              colors={['#FBBF24', '#D97706']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.buttonLayout}>
                  <Text style={styles.continueButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING['3xl'],
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
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: FONTS.primary,
    lineHeight: 22,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  goalsContainer: {
    gap: SPACING.md,
  },
  goalCard: {
    height: 110,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  goalCardSelected: {
    borderColor: '#FBBF24',
    borderWidth: 2,
  },
  goalImageBackground: {
    flex: 1,
  },
  goalImageStyle: {
    opacity: 0.6,
  },
  goalImageGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalLabelText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: FONTS.primary,
  },
  goalDescriptionText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: FONTS.primary,
  },
  goalCheck: {
    position: 'absolute',
    right: 0,
    top: 5,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dietCard: {
    width: '48%',
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dietCardSelected: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  dietIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dietLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  dietLabelSelected: {
    color: '#FFF',
  },
  dietCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#222',
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    fontFamily: FONTS.primary,
  },
});
