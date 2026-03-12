import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

// Sincronizado con Prisma: profiles.workout_frequency (String?)
const WORKOUT_FREQUENCIES = [
  {
    id: 'sedentary',
    label: 'Sedentario',
    description: 'Poco o ningún ejercicio',
    icon: 'couch' as keyof typeof Ionicons.glyphMap,
    color: COLORS.text.muted,
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop',
  },
  {
    id: 'light',
    label: 'Ligero',
    description: '1-2 días por semana',
    icon: 'walk' as keyof typeof Ionicons.glyphMap,
    color: COLORS.primary.sky,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  },
  {
    id: 'moderate',
    label: 'Moderado',
    description: '3-4 días por semana',
    icon: 'bicycle' as keyof typeof Ionicons.glyphMap,
    color: COLORS.primary.amber,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
  },
  {
    id: 'active',
    label: 'Activo',
    description: '5-6 días por semana',
    icon: 'fitness' as keyof typeof Ionicons.glyphMap,
    color: COLORS.status.success,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  },
  {
    id: 'very_active',
    label: 'Muy Activo',
    description: 'Todos los días o ejercicio intenso',
    icon: 'flame' as keyof typeof Ionicons.glyphMap,
    color: COLORS.status.error,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
  },
];

// Sincronizado con Prisma: profiles.steps_goal (Int @default(10000))
const STEPS_GOALS = [
  { id: 5000, label: '5,000', description: 'Meta básica' },
  { id: 8000, label: '8,000', description: 'Meta moderada' },
  { id: 10000, label: '10,000', description: 'Meta recomendada' },
  { id: 12000, label: '12,000', description: 'Meta alta' },
  { id: 15000, label: '15,000', description: 'Meta muy alta' },
];

export default function OnboardingActivityScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  
  // Estados para actividad (sincronizados con Prisma)
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [selectedStepsGoal, setSelectedStepsGoal] = useState<number>(10000);
  const [isLoading, setIsLoading] = useState(false);

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkout(workoutId);
  };

  const handleStepsGoalSelect = (goal: number) => {
    setSelectedStepsGoal(goal);
  };

  const handleContinue = async () => {
    if (!selectedWorkout || !user) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: profiles
      await updateProfile.mutateAsync({
        workout_frequency: selectedWorkout, // String?
        steps_goal: selectedStepsGoal, // Int @default(10000)
        onboarding_step: 'preferences',
      });

      navigation.navigate('OnboardingPreferences' as never);
    } catch (error) {
      console.error('Error updating activity:', error);
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
            <Text style={styles.title}>¿Cuál es tu nivel de actividad?</Text>
            <Text style={styles.subtitle}>
              Esto nos ayuda a ajustar tus metas calóricas y de pasos
            </Text>
          </View>

          {/* Workout Frequency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frecuencia de Ejercicio</Text>
            <View style={styles.workoutGrid}>
              {WORKOUT_FREQUENCIES.map((workout) => (
                <TouchableOpacity
                  key={workout.id}
                  style={[
                    styles.workoutCard,
                    selectedWorkout === workout.id && styles.workoutCardSelected,
                  ]}
                  onPress={() => handleWorkoutSelect(workout.id)}
                  disabled={isLoading}
                >
                  <ImageBackground
                    source={{ uri: workout.image }}
                    style={styles.workoutImageBackground}
                    imageStyle={styles.workoutImageStyle}
                  >
                    <LinearGradient
                      colors={
                        selectedWorkout === workout.id 
                          ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
                          : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']
                      }
                      style={styles.workoutImageGradient}
                    >
                      <View style={styles.workoutContent}>
                        <View style={[
                          styles.workoutIconContainer,
                          { backgroundColor: selectedWorkout === workout.id ? workout.color : 'rgba(0, 0, 0, 0.6)' }
                        ]}>
                          <Ionicons 
                            name={workout.icon} 
                            size={24} 
                            color={COLORS.text.primary} 
                          />
                        </View>
                        <Text style={styles.workoutLabel}>{workout.label}</Text>
                        <Text style={styles.workoutDescription}>{workout.description}</Text>
                        {selectedWorkout === workout.id && (
                          <View style={styles.workoutCheck}>
                            <Ionicons name="checkmark-circle" size={24} color={workout.color} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Steps Goal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meta Diaria de Pasos</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.stepsHeader}>
                <Ionicons name="footsteps" size={24} color={COLORS.primary.sky} />
                <Text style={styles.stepsTitle}>¿Cuántos pasos diarios?</Text>
              </View>
              
              <View style={styles.stepsGrid}>
                {STEPS_GOALS.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.stepsCard,
                      selectedStepsGoal === goal.id && styles.stepsCardSelected,
                      { borderColor: selectedStepsGoal === goal.id ? COLORS.primary.sky : COLORS.background.border }
                    ]}
                    onPress={() => handleStepsGoalSelect(goal.id)}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.stepsValue,
                      selectedStepsGoal === goal.id && styles.stepsValueSelected
                    ]}>
                      {goal.label.toLocaleString()}
                    </Text>
                    <Text style={styles.stepsDescription}>{goal.description}</Text>
                    {selectedStepsGoal === goal.id && (
                      <View style={styles.stepsCheck}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.sky} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="calculator" size={20} color={COLORS.primary.amber} />
              <Text style={styles.infoText}>
                Calculamos tus calorías basadas en tu nivel de actividad
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="trophy" size={20} color={COLORS.status.success} />
              <Text style={styles.infoText}>
                Puedes ajustar tus metas en cualquier momento
              </Text>
            </View>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={COLORS.text.muted} />
            <Text style={styles.privacyText}>
              Tu información de actividad es privada y segura
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedWorkout && styles.continueButtonDisabled,
              isLoading && styles.continueButtonLoading
            ]}
            onPress={handleContinue}
            disabled={!selectedWorkout || isLoading}
          >
            <LinearGradient
              colors={selectedWorkout ? [COLORS.primary.sky, '#0EA5E9'] : [COLORS.background.border, COLORS.background.border]}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Text style={styles.continueButtonText}>Guardando...</Text>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.text.primary} />
                </>
              )}
            </LinearGradient>
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
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  workoutCard: {
    width: '48%',
    height: 140,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  workoutCardSelected: {
    borderWidth: 3,
    ...SHADOWS.md,
  },
  workoutImageBackground: {
    flex: 1,
    width: '100%',
  },
  workoutImageStyle: {
    resizeMode: 'cover',
  },
  workoutImageGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  workoutContent: {
    position: 'relative',
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  workoutLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  workoutDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  workoutCheck: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  stepsContainer: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  stepsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stepsCard: {
    width: '31%',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    position: 'relative',
  },
  stepsCardSelected: {
    backgroundColor: `${COLORS.primary.sky}20`,
    borderWidth: 2,
  },
  stepsValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  stepsValueSelected: {
    color: COLORS.primary.sky,
  },
  stepsDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  stepsCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  infoSection: {
    marginBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
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
