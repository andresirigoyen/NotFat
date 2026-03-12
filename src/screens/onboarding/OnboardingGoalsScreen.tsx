import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

// Sincronizado con Prisma: profiles.nutrition_goal y profiles.achievement_goal
const NUTRITION_GOALS = [
  {
    id: 'lose_weight',
    label: 'Perder Peso',
    icon: 'trending-down' as keyof typeof Ionicons.glyphMap,
    description: 'Reducir grasa corporal de forma saludable',
    color: COLORS.primary.sky,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  },
  {
    id: 'maintain_weight',
    label: 'Mantener Peso',
    icon: 'remove' as keyof typeof Ionicons.glyphMap,
    description: 'Mantener peso actual saludable',
    color: COLORS.primary.amber,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
  },
  {
    id: 'gain_muscle',
    label: 'Ganar Músculo',
    icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
    description: 'Aumentar masa muscular y fuerza',
    color: COLORS.status.success,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  },
  {
    id: 'improve_health',
    label: 'Mejorar Salud',
    icon: 'heart' as keyof typeof Ionicons.glyphMap,
    description: 'Mejorar hábitos y bienestar general',
    color: COLORS.status.error,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  },
];

// Sincronizado con Prisma: profiles.diet_type
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
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const [selectedNutritionGoal, setSelectedNutritionGoal] = useState<string>('');
  const [selectedDietType, setSelectedDietType] = useState<string>('balanced');
  const [isLoading, setIsLoading] = useState(false);

  const handleNutritionGoalSelect = (goalId: string) => {
    setSelectedNutritionGoal(goalId);
  };

  const handleDietTypeSelect = (dietId: string) => {
    setSelectedDietType(dietId);
  };

  const handleContinue = async () => {
    if (!selectedNutritionGoal || !user) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: profiles.nutrition_goal, profiles.achievement_goal, profiles.diet_type
      await updateProfile({
        nutrition_goal: selectedNutritionGoal, // String @db.VarChar(255)
        achievement_goal: selectedNutritionGoal, // String @db.VarChar(255)
        diet_type: selectedDietType, // String @default("Balanced")
        onboarding_step: 'completed',
        onboarding_completed: true, // Boolean?
      });

      // Navegar a la pantalla principal
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Error updating goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '75%' }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>¿Cuáles son tus metas?</Text>
            <Text style={styles.subtitle}>
              Personalizamos tu experiencia según tus objetivos y preferencias
            </Text>
          </View>

          {/* Nutrition Goals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tu Objetivo Principal</Text>
            <View style={styles.goalsContainer}>
              {NUTRITION_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    selectedNutritionGoal === goal.id && styles.goalCardSelected,
                    { borderColor: selectedNutritionGoal === goal.id ? goal.color : COLORS.background.border }
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
                          ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
                          : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']
                      }
                      style={styles.goalImageGradient}
                    >
                      <View style={styles.goalContent}>
                        <View style={[
                          styles.goalIconContainer,
                          { backgroundColor: selectedNutritionGoal === goal.id ? goal.color : 'rgba(0, 0, 0, 0.6)' }
                        ]}>
                          <Ionicons 
                            name={goal.icon} 
                            size={24} 
                            color={COLORS.text.primary} 
                          />
                        </View>
                        <Text style={styles.goalLabel}>{goal.label}</Text>
                        <Text style={styles.goalDescription}>{goal.description}</Text>
                        {selectedNutritionGoal === goal.id && (
                          <View style={styles.goalCheck}>
                            <Ionicons name="checkmark-circle" size={24} color={goal.color} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Diet Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Dieta</Text>
            <View style={styles.dietGrid}>
              {DIET_TYPES.map((diet) => (
                <TouchableOpacity
                  key={diet.id}
                  style={[
                    styles.dietCard,
                    selectedDietType === diet.id && styles.dietCardSelected,
                    { borderColor: selectedDietType === diet.id ? COLORS.primary.sky : COLORS.background.border }
                  ]}
                  onPress={() => handleDietTypeSelect(diet.id)}
                  disabled={isLoading}
                >
                  <View style={[
                    styles.dietIconContainer,
                    { backgroundColor: selectedDietType === diet.id ? `${COLORS.primary.sky}20` : COLORS.background.tertiary }
                  ]}>
                    <Ionicons 
                      name={diet.icon} 
                      size={24} 
                      color={selectedDietType === diet.id ? COLORS.primary.sky : COLORS.text.secondary} 
                    />
                  </View>
                  <Text style={[
                    styles.dietLabel,
                    selectedDietType === diet.id && styles.dietLabelSelected
                  ]}>
                    {diet.label}
                  </Text>
                  <Text style={styles.dietDescription}>{diet.description}</Text>
                  {selectedDietType === diet.id && (
                    <View style={styles.dietCheck}>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.sky} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={COLORS.text.muted} />
            <Text style={styles.privacyText}>
              Tus preferencias nos ayudan a crear un plan personalizado para ti
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('OnboardingAIGoals' as never)}
          >
            <LinearGradient
              colors={[COLORS.primary.sky, '#0EA5E9']}
              style={styles.aiButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="sparkles" size={20} color={COLORS.text.primary} />
              <Text style={styles.aiButtonText}>Generar con IA</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => navigation.navigate('OnboardingProfile' as never)}
          >
            <Ionicons name="create" size={20} color={COLORS.text.secondary} />
            <Text style={styles.manualButtonText}>Configurar manualmente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 2,
    marginLeft: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary.sky,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    lineHeight: 24,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  goalsContainer: {
    marginBottom: SPACING.md,
  },
  goalCard: {
    height: 120,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 2,
    ...SHADOWS.md,
  },
  goalCardSelected: {
    borderWidth: 3,
    ...SHADOWS.lg,
  },
  goalImageBackground: {
    flex: 1,
    width: '100%',
  },
  goalImageStyle: {
    resizeMode: 'cover',
  },
  goalImageGradient: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  goalContent: {
    position: 'relative',
  },
  goalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  goalLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goalDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  goalCheck: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dietCard: {
    width: '48%',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    position: 'relative',
    ...SHADOWS.sm,
  },
  dietCardSelected: {
    borderWidth: 2,
    backgroundColor: `${COLORS.primary.sky}10`,
  },
  dietIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dietLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  dietLabelSelected: {
    color: COLORS.primary.sky,
  },
  dietDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    lineHeight: 14,
  },
  dietCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  privacyText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonLoading: {
    opacity: 0.8,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
});
