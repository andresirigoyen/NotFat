import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { analytics } from '@/services/analytics';
import { useOnboardingStore } from '@/store/onboarding-store';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

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
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile, generateAutomaticGoals, generateAutomaticHydrationGoal } = useProfile();
  const { setData: setOnboardingData } = useOnboardingStore();

  useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingAIGoals' });
  }, []);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGoals, setAiGoals] = useState<AIGeneratedGoals | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analytics.trackScreenView('OnboardingAIGoals');
  }, []);

  const generateAIGoals = async () => {
    if (!user) return;
    setIsGenerating(true);
    setError(null);
    setShowResults(false);

    try {
      const goals = await generateAutomaticGoals();
      const hydration = await generateAutomaticHydrationGoal();

      const result: AIGeneratedGoals = {
        calories: goals.calories ?? 0,
        protein: goals.protein ?? 0,
        carbs: goals.carbs ?? 0,
        fat: goals.fat ?? 0,
        water_ml: hydration.target ?? 0,
        steps_daily: (goals as any).steps_daily ?? 10000,
        workout_frequency: (goals as any).workout_frequency ?? 'moderate',
        reasoning: 'Estas metas se calcularon con precisión analítica para que sean realistas y sostenibles según tu perfil único.',
      };

      setAiGoals(result);
      setShowResults(true);
      analytics.trackOnboardingStep('ai_goals_generated', { calories: result.calories });
    } catch (err) {
      setError('No pudimos generar tus metas. Intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAIGoals = async () => {
    if (!aiGoals || !user) return;
    try {
      await updateProfile.mutateAsync({ onboarding_step: 'preferences' });
      navigation.navigate('OnboardingPreferences' as never);
    } catch (error) {
      Alert.alert('Error', 'No pudimos guardar tus metas.');
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.progressWrapper}>
             <View style={styles.progressBackground}>
               <View style={[styles.progressBar, { width: '85%' }]} />
             </View>
             <Text style={styles.progressLabel}>METAS IA</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Metas Inteligentes</Text>
            <Text style={styles.subtitle}>
              Nuestra IA analizará tu perfil completo para crear objetivos de alto rendimiento.
            </Text>
          </View>

          <View style={styles.aiCard}>
             {!showResults ? (
               <View style={styles.aiInitialContent}>
                 <View style={styles.aiIconWrapper}>
                   <Ionicons name="sparkles" size={48} color="#FBBF24" />
                 </View>
                 <Text style={styles.aiCardTitle}>IA de Alta Resolución</Text>
                 <Text style={styles.aiCardDesc}>Lista para procesar tus requerimientos metabólicos.</Text>
                 
                 <TouchableOpacity 
                   style={styles.generateButton}
                   onPress={generateAIGoals}
                   disabled={isGenerating}
                 >
                   <LinearGradient
                     colors={['#FBBF24', '#D97706']}
                     style={styles.buttonGradient}
                   >
                     {isGenerating ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Activar Análisis</Text>}
                   </LinearGradient>
                 </TouchableOpacity>
               </View>
             ) : (
               <View style={styles.aiResultsContent}>
                  <View style={styles.reasoningCard}>
                    <Text style={styles.reasoningLabel}>Análisis Biológico:</Text>
                    <Text style={styles.reasoningText}>{aiGoals?.reasoning}</Text>
                  </View>

                  <View style={styles.goalsGrid}>
                    <View style={styles.goalBox}>
                      <Text style={styles.goalVal}>{aiGoals?.calories}</Text>
                      <Text style={styles.goalLab}>KCAL</Text>
                    </View>
                    <View style={styles.goalBox}>
                      <Text style={styles.goalVal}>{aiGoals?.protein}g</Text>
                      <Text style={styles.goalLab}>PROTEÍNA</Text>
                    </View>
                    <View style={styles.goalBox}>
                      <Text style={styles.goalVal}>{aiGoals?.water_ml}ml</Text>
                      <Text style={styles.goalLab}>AGUA</Text>
                    </View>
                    <View style={styles.goalBox}>
                      <Text style={styles.goalVal}>{aiGoals?.steps_daily}</Text>
                      <Text style={styles.goalLab}>PASOS</Text>
                    </View>
                  </View>
               </View>
             )}
          </View>

          {showResults && (
            <TouchableOpacity style={styles.confirmButton} onPress={saveAIGoals}>
              <LinearGradient colors={['#FBBF24', '#D97706']} style={styles.buttonGradient}>
                 <Text style={styles.buttonText}>Aceptar Plan IA</Text>
                 <Ionicons name="arrow-forward" size={20} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.manualButton}
            onPress={() => navigation.navigate('OnboardingGoals' as never)}
          >
            <Text style={styles.manualButtonText}>Configurar manualmente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: SPACING['3xl'] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, height: 60 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  progressWrapper: { flex: 1, marginLeft: SPACING.lg },
  progressBackground: { height: 6, backgroundColor: '#111', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressBar: { height: '100%', backgroundColor: '#FBBF24', borderRadius: 3 },
  progressLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  content: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl },
  titleSection: { marginBottom: SPACING.xl },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#9CA3AF', lineHeight: 22 },
  aiCard: { backgroundColor: '#111', borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: '#222' },
  aiInitialContent: { alignItems: 'center', gap: SPACING.md },
  aiIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(251, 191, 36, 0.1)', justifyContent: 'center', alignItems: 'center' },
  aiCardTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  aiCardDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  generateButton: { width: '100%', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginTop: SPACING.md },
  buttonGradient: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonText: { fontSize: 16, fontWeight: '800', color: '#000' },
  aiResultsContent: { gap: SPACING.xl },
  reasoningCard: { backgroundColor: '#1A1A1A', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderLeftWidth: 3, borderLeftColor: '#FBBF24' },
  reasoningLabel: { fontSize: 12, fontWeight: '800', color: '#FBBF24', marginBottom: 4 },
  reasoningText: { fontSize: 14, color: '#FFF', lineHeight: 20 },
  goalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  goalBox: { flex: 1, minWidth: '45%', backgroundColor: '#1A1A1A', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  goalVal: { fontSize: 22, fontWeight: '900', color: '#FFF' },
  goalLab: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
  confirmButton: { marginTop: SPACING.xl, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden' },
  manualButton: { marginTop: SPACING.lg, alignItems: 'center' },
  manualButtonText: { color: '#6B7280', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
