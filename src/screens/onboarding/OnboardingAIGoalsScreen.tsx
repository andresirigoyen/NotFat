import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

// Sincronizado con Prisma: nutrition_goals table
interface AIGeneratedGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_ml: number;
  steps_daily: number;
  workout_frequency: string;
  reasoning: string;
}

export default function OnboardingAIGoalsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  
  // Estados para la generación de metas con IA
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGoals, setAiGoals] = useState<AIGeneratedGoals | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generar metas con IA (simulado - en producción llamaría a Edge Function)
  const generateAIGoals = async () => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);
    setShowResults(false);

    try {
      // Simulación de llamada a IA (en producción sería una Edge Function)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular respuesta de IA basada en perfil del usuario
      const mockAIResponse: AIGeneratedGoals = {
        calories: 2200,
        protein: 120,
        carbs: 275,
        fat: 73,
        water_ml: 2500,
        steps_daily: 10000,
        workout_frequency: 'moderate',
        reasoning: 'Basado en tu perfil (edad, peso, altura y nivel de actividad), he calculado metas personalizadas para ayudarte a alcanzar tus objetivos de forma saludable y sostenible.'
      };

      setAiGoals(mockAIResponse);
      setShowResults(true);
    } catch (err) {
      setError('No pudimos generar tus metas. Intenta nuevamente.');
      console.error('AI Goals Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Guardar metas generadas por IA
  const saveAIGoals = async () => {
    if (!aiGoals || !user) return;

    try {
      // Sincronizado con Prisma: profiles
      await updateProfile({
        onboarding_step: 'completed',
        onboarding_completed: true,
      });

      // Aquí también se guardarían en la tabla nutrition_goals de Prisma
      // await saveNutritionGoals({
      //   user_id: user.id,
      //   calories: aiGoals.calories,
      //   protein: aiGoals.protein,
      //   carbs: aiGoals.carbs,
      //   fat: aiGoals.fat,
      //   start_date: new Date().toISOString(),
      //   source: 'ia'
      // });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Error saving AI goals:', error);
      Alert.alert('Error', 'No pudimos guardar tus metas. Intenta nuevamente.');
    }
  };

  // Opción manual
  const handleManualSetup = () => {
    navigation.navigate('OnboardingGoals' as never);
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
            <View style={[styles.progressBar, { width: '85%' }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Metas Personalizadas con IA</Text>
            <Text style={styles.subtitle}>
              Nuestra IA analizará tu perfil para crear metas perfectas para ti
            </Text>
          </View>

          {/* AI Status Card */}
          <View style={styles.aiCard}>
            <LinearGradient
              colors={[COLORS.primary.sky, '#0EA5E9']}
              style={styles.aiGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.aiContent}>
                {isGenerating ? (
                  <View style={styles.generatingContent}>
                    <ActivityIndicator size="large" color={COLORS.text.primary} />
                    <Text style={styles.generatingText}>Analizando tu perfil...</Text>
                    <Text style={styles.generatingSubtext}>
                      Nuestra IA está creando metas personalizadas para ti
                    </Text>
                  </View>
                ) : showResults && aiGoals ? (
                  <View style={styles.resultsContent}>
                    <View style={styles.aiIconContainer}>
                      <Ionicons name="sparkles" size={32} color={COLORS.text.primary} />
                    </View>
                    <Text style={styles.resultsTitle}>¡Metas Generadas!</Text>
                    <Text style={styles.resultsSubtitle}>
                      Basadas en tu perfil único
                    </Text>
                  </View>
                ) : (
                  <View style={styles.initialContent}>
                    <View style={styles.aiIconContainer}>
                      <Ionicons name="analytics" size={32} color={COLORS.text.primary} />
                    </View>
                    <Text style={styles.initialTitle}>IA Lista para Analizar</Text>
                    <Text style={styles.initialSubtitle}>
                      Presiona el botón para generar tus metas personalizadas
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* AI Results */}
          {showResults && aiGoals && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>Tus Metas Personalizadas</Text>
              
              {/* Reasoning */}
              <View style={styles.reasoningCard}>
                <View style={styles.reasoningHeader}>
                  <Ionicons name="bulb" size={20} color={COLORS.primary.amber} />
                  <Text style={styles.reasoningTitle}>¿Por qué estas metas?</Text>
                </View>
                <Text style={styles.reasoningText}>{aiGoals.reasoning}</Text>
              </View>

              {/* Goals Grid */}
              <View style={styles.goalsGrid}>
                <View style={styles.goalItem}>
                  <Ionicons name="flame" size={24} color={COLORS.status.error} />
                  <Text style={styles.goalValue}>{aiGoals.calories}</Text>
                  <Text style={styles.goalLabel}>Calorías/día</Text>
                </View>

                <View style={styles.goalItem}>
                  <Ionicons name="fitness" size={24} color={COLORS.primary.sky} />
                  <Text style={styles.goalValue}>{aiGoals.protein}g</Text>
                  <Text style={styles.goalLabel}>Proteína</Text>
                </View>

                <View style={styles.goalItem}>
                  <Ionicons name="nutrition" size={24} color={COLORS.primary.amber} />
                  <Text style={styles.goalValue}>{aiGoals.carbs}g</Text>
                  <Text style={styles.goalLabel}>Carbohidratos</Text>
                </View>

                <View style={styles.goalItem}>
                  <Ionicons name="water" size={24} color={COLORS.status.success} />
                  <Text style={styles.goalValue}>{aiGoals.water_ml}ml</Text>
                  <Text style={styles.goalLabel">Agua</Text>
                </View>

                <View style={styles.goalItem}>
                  <Ionicons name="footsteps" size={24} color={COLORS.status.info} />
                  <Text style={styles.goalValue">{aiGoals.steps_daily.toLocaleString()}</Text>
                  <Text style={styles.goalLabel">Pasos/día</Text>
                </View>

                <View style={styles.goalItem}>
                  <Ionicons name="bicycle" size={24} color={COLORS.text.secondary} />
                  <Text style={styles.goalValue">{aiGoals.workout_frequency}</Text>
                  <Text style={styles.goalLabel">Ejercicio</Text>
                </View>
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={20} color={COLORS.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {!showResults ? (
              <TouchableOpacity
                style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                onPress={generateAIGoals}
                disabled={isGenerating}
              >
                <LinearGradient
                  colors={[COLORS.primary.sky, '#0EA5E9']}
                  style={styles.generateButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color={COLORS.text.primary} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color={COLORS.text.primary} />
                      <Text style={styles.generateButtonText">Generar con IA</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveAIGoals}
              >
                <LinearGradient
                  colors={[COLORS.status.success, '#059669']}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.text.primary} />
                  <Text style={styles.saveButtonText">Usar estas metas</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.manualButton}
              onPress={handleManualSetup}
            >
              <Ionicons name="create" size={20} color={COLORS.text.secondary} />
              <Text style={styles.manualButtonText">Configurar manualmente</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.text.muted} />
            <Text style={styles.privacyText">
              Tus metas se guardan de forma privada y puedes cambiarlas cuando quieras
            </Text>
          </View>
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
  aiCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  aiGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContent: {
    alignItems: 'center',
  },
  generatingContent: {
    alignItems: 'center',
  },
  generatingText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  generatingSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  resultsContent: {
    alignItems: 'center',
  },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultsTitle: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  resultsSubtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  initialContent: {
    alignItems: 'center',
  },
  initialTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  initialSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  reasoningCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  reasoningTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  reasoningText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    lineHeight: 22,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalItem: {
    width: '48%',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  goalValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  goalLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.status.error,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.status.error,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  actionSection: {
    marginBottom: SPACING.xl,
  },
  generateButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  generateButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    gap: SPACING.sm,
  },
  manualButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
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
});
