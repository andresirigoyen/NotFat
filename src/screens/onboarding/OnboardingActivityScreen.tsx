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

const STEPS_GOALS = [
  { id: 5000, label: '5k', description: 'Mínimo' },
  { id: 8000, label: '8k', description: 'Activo' },
  { id: 10000, label: '10k', description: 'Ideal' },
  { id: 12000, label: '12k', description: 'Atleta' },
];

export default function OnboardingActivityScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const WORKOUT_FREQUENCIES = React.useMemo(() => [
    {
      id: 'sedentary',
      label: 'Sedentario',
      description: 'Poco ejercicio',
      icon: 'bed-outline' as keyof typeof Ionicons.glyphMap,
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop',
    },
    {
      id: 'light',
      label: 'Ligero',
      description: '1-2 días/sem',
      icon: 'walk-outline' as keyof typeof Ionicons.glyphMap,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    },
    {
      id: 'moderate',
      label: 'Moderado',
      description: '3-4 días/sem',
      icon: 'bicycle-outline' as keyof typeof Ionicons.glyphMap,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
    },
    {
      id: 'active',
      label: 'Activo',
      description: '5-6 días/sem',
      icon: 'fitness-outline' as keyof typeof Ionicons.glyphMap,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    },
  ], []);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile, upsertActivityProfile } = useProfile();
  const { setData: setOnboardingData } = useOnboardingStore();
  
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [selectedStepsGoal, setSelectedStepsGoal] = useState<number>(10000);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingActivity' });
  }, []);

  const handleWorkoutSelect = (workoutId: string) => {
    setSelectedWorkout(workoutId);
  };

  const handleStepsGoalSelect = (goal: number) => {
    setSelectedStepsGoal(goal);
  };

  const handleContinue = async () => {
    if (!selectedWorkout) return;

    setIsLoading(true);
    try {
      const dailyActivityLevel = (() => {
        switch (selectedWorkout) {
          case 'sedentary': return 'sedentary';
          case 'light': return 'lightly_active';
          case 'moderate': return 'moderately_active';
          case 'active': return 'very_active';
          default: return 'moderately_active';
        }
      })();

      if (user) {
        await upsertActivityProfile.mutateAsync({
          daily_activity_level: dailyActivityLevel,
          does_sport: selectedWorkout !== 'sedentary',
        } as any);

        await updateProfile.mutateAsync({
          workout_frequency: selectedWorkout,
          steps_goal: selectedStepsGoal,
          onboarding_step: 'preferences',
        });
      } else {
        setOnboardingData({
          activity_level: selectedWorkout,
          workout_frequency: selectedWorkout,
          steps_goal: selectedStepsGoal,
        });
      }

      analytics.trackOnboardingStep('activity', {
        workout_frequency: selectedWorkout,
        steps_goal: selectedStepsGoal,
        daily_activity_level: dailyActivityLevel,
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
               <View style={[styles.progressBar, { width: '60%' }]} />
             </View>
             <Text style={styles.progressLabel}>PASO 6 DE 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>¿Cuál es tu nivel de actividad?</Text>
            <Text style={styles.subtitle}>
              Esto nos ayuda a ajustar tus metas calóricas y de pasos con precisión.
            </Text>
          </View>

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
                          ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']
                          : ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']
                      }
                      style={styles.workoutImageGradient}
                    >
                      <View style={styles.workoutContent}>
                        <View style={[
                          styles.workoutIconContainer,
                          { backgroundColor: selectedWorkout === workout.id ? '#FBBF24' : 'rgba(255, 255, 255, 0.1)' }
                        ]}>
                          <Ionicons 
                            name={workout.icon} 
                            size={20} 
                            color={selectedWorkout === workout.id ? '#000' : '#FFF'} 
                          />
                        </View>
                        <Text style={styles.workoutLabel}>{workout.label}</Text>
                        <Text style={styles.workoutDescription}>{workout.description}</Text>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meta Diaria de Pasos</Text>
            <View style={styles.stepsGrid}>
              {STEPS_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.stepsCard,
                    selectedStepsGoal === goal.id && styles.stepsCardSelected,
                  ]}
                  onPress={() => handleStepsGoalSelect(goal.id)}
                  disabled={isLoading}
                >
                  <Text style={[
                    styles.stepsValue,
                    selectedStepsGoal === goal.id && styles.stepsValueSelected
                  ]}>
                    {goal.label}
                  </Text>
                  <Text style={styles.stepsDescription}>{goal.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.privacyCard}>
            <Ionicons name="flash" size={16} color="#FBBF24" />
            <Text style={styles.privacyText}>
              Calculamos tus requerimientos metabólicos basados en estos datos.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedWorkout && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedWorkout || isLoading}
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
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  workoutCard: {
    width: '47%',
    height: 150,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  workoutCardSelected: {
    borderColor: '#FBBF24',
    borderWidth: 2,
  },
  workoutImageBackground: {
    flex: 1,
  },
  workoutImageStyle: {
    opacity: 0.6,
  },
  workoutImageGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  workoutContent: {
    gap: 4,
  },
  workoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  workoutDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  stepsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  stepsCardSelected: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  stepsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6B7280',
  },
  stepsValueSelected: {
    color: '#FFF',
  },
  stepsDescription: {
    fontSize: 12,
    color: '#6B7280',
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
