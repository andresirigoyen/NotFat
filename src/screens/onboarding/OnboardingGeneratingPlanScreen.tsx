import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, StackActions } from '@react-navigation/native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  FadeInDown,
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  useSharedValue,
  withDelay,
  withSpring
} from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { supabase } from '@/services/SupabaseContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { Sparkles, Brain, Rocket, Activity, Zap, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/hooks/useNotifications';
import { useOnboardingStore } from '@/store/onboarding-store';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const ANALYSING_STEPS = [
  { id: 1, label: 'Perfil Biológico', icon: Activity },
  { id: 2, label: 'TDEE & Macros', icon: Zap },
  { id: 3, label: 'Hacks Conductuales', icon: Brain },
  { id: 4, label: 'Seguridad Metabólica', icon: CheckCircle2 },
];

export default function OnboardingGeneratingPlanScreen() {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { data: localData, reset } = useOnboardingStore();
  const notifications = useNotifications();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    const calculateLocalFallback = async () => {
      if (!localData) return;
      
      const weight = localData.weight_value || 70;
      const height = localData.height_value || 170;
      const age = 30;
      const gender = localData.gender || 'male';
      const goal = localData.nutrition_goal || 'maintain_weight';
      
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      bmr = gender === 'male' ? bmr + 5 : bmr - 161;
      
      const maintenanceCals = bmr * 1.375;
      let targetCals = maintenanceCals;
      
      if (goal === 'lose_weight') targetCals -= 500;
      if (goal === 'gain_muscle') targetCals += 500;
      
      const minCals = gender === 'female' ? 1200 : 1500;
      targetCals = Math.max(targetCals, minCals);
      
      const fallbackPlan = {
        plan_nutricional: {
          calorias_objetivo: Math.round(targetCals),
          macros: {
            proteina_g: Math.round(weight * 2),
            carbos_g: Math.round((targetCals * 0.4) / 4),
            grasas_g: Math.round((targetCals * 0.25) / 9),
          },
          semanas_estimadas: 12
        },
        estrategia_conductual: {
          hack_fines_de_semana: "Planifica tus comidas sociales con antelación.",
          manejo_de_entorno: "Ten siempre snacks saludables a la vista.",
          tip_motivacional_personalizado: "Pequeños pasos llevan a grandes resultados."
        }
      };

      await supabase.from('profiles').update({
        nutritional_plan: fallbackPlan,
        onboarding_completed: true,
        onboarding_step: 'completed'
      }).eq('id', user!.id);

      return {
        porcentaje: 85,
        barrera_principal: 'Consistencia inicial',
        mensaje_analisis: 'Basado en tu perfil biológico y psicológico, tienes una alta probabilidad de éxito si mantienes el registro diario.'
      };
    };

    const generatePlan = async () => {
      try {
        await supabase.from('profiles').update({
          onboarding_step: 'generating_plan',
          onboarding_completed: false
        }).eq('id', user!.id);

        const startTime = Date.now();
        
        // Simulación visual de pasos
        const stepInterval = setInterval(() => {
          setCurrentStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 1500);

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT_LIMIT_REACHED')), 8000)
        );

        const aiPromise = supabase.functions.invoke('generate-nutritional-plan', {
          body: { userId: user!.id },
        });

        const result: any = await Promise.race([aiPromise, timeoutPromise]);
        clearInterval(stepInterval);
        
        const { data, error } = result;
        if (error || !data) throw new Error(error?.message || 'Empty response');

        const executionTime = Date.now() - startTime;
        const minDelay = 4500;
        if (executionTime < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - executionTime));
        }

        if (data.plan_nutricional?.semanas_estimadas) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + (data.plan_nutricional.semanas_estimadas * 7));
          await supabase.from('profiles').update({
            target_date: targetDate.toISOString().split('T')[0]
          }).eq('id', user!.id);
        }

        setPredictionData(data.prediccion_exito || { porcentaje: 92, barrera_principal: 'Social Events', mensaje_analisis: 'Tu perfil muestra una resiliencia superior.' });
        setShowPrediction(true);
        await new Promise(resolve => setTimeout(resolve, 4000));
        reset();
      } catch (e: any) {
        console.warn('[Onboarding] Fallback triggered:', e.message);
        setCurrentStep(3); // Completar visualmente
        const fallbackPrediction = await calculateLocalFallback();
        setPredictionData(fallbackPrediction);
        setShowPrediction(true);
        await new Promise(resolve => setTimeout(resolve, 4000));
        reset();
      } finally {
        try {
          const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'amigo';
          await notifications.schedulePushNotification(
            '🚀 ¡Tu plan está listo!',
            `¡${userName}, hemos diseñado tu estrategia perfecta para alcanzar tu meta.`,
            2 * 60 * 60
          );
        } catch (notifErr) {
          console.warn('[Onboarding] Notification schedule failed:', notifErr);
        }

        navigation.dispatch(StackActions.replace('Main'));
      }
    };

    generatePlan();
  }, [user, localData, navigation, notifications, reset, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: withTiming(currentStep / 3 + 0.3),
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000', colors.background.secondary, '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {showPrediction ? (
          <Animated.View entering={FadeIn.duration(1000)} style={styles.predictionContent}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.15)', 'transparent']}
              style={styles.predictionBg}
            />
            <Rocket size={48} color={colors.primary.amber} style={styles.rocketIcon} />
            <Text style={styles.predictionTitle}>Tu Predicción de Éxito</Text>
            
            <View style={styles.scoreOuter}>
              <Animated.View style={[styles.scoreCircle, pulseStyle]}>
                <Text style={styles.scoreText}>{predictionData?.porcentaje}%</Text>
                <Text style={styles.scoreSubtext}>probabilidad</Text>
              </Animated.View>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.barrierHeader}>
                <Brain size={18} color={colors.primary.amber} />
                <Text style={styles.barrierTitle}>RETO IDENTIFICADO</Text>
              </View>
              <Text style={styles.barrierDesc}>{predictionData?.barrera_principal}</Text>
              <Text style={styles.analysisText}>{predictionData?.mensaje_analisis}</Text>
            </View>

            <View style={styles.planBadge}>
              <Sparkles size={14} color="#000" />
              <Text style={styles.planBadgeText}>ESTRATEGIA BLINDADA POR IA</Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.content}>
            <View style={styles.animContainer}>
              <Animated.View style={[styles.glowRing, pulseStyle]} />
              <Brain size={60} color={colors.primary.amber} />
            </View>
            
            <Text style={styles.mainTitle}>Creando tu plan...</Text>
            
            <View style={styles.stepsContainer}>
              {ANALYSING_STEPS.map((step, index) => {
                const isActive = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <Animated.View 
                    key={step.id} 
                    entering={FadeInDown.delay(index * 200)}
                    style={[styles.stepRow, isActive && styles.stepRowActive]}
                  >
                    <View style={[styles.stepIcon, isActive && styles.stepIconActive]}>
                      <step.icon size={18} color={isActive ? colors.background.primary : colors.text.muted} />
                    </View>
                    <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                      {step.label}
                    </Text>
                    {isCurrent && <ActivityIndicator size="small" color={colors.primary.amber} />}
                  </Animated.View>
                );
              })}
            </View>
            
            <Text style={styles.footerNote}>
              Estamos procesando tus datos junto con miles de parámetros científicos...
            </Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  animContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  glowRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: FONTS.primary,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: SPACING['3xl'],
  },
  stepsContainer: {
    width: '100%',
    paddingHorizontal: SPACING.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    opacity: 0.3,
  },
  stepRowActive: {
    opacity: 1,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepIconActive: {
    backgroundColor: '#FBBF24',
  },
  stepLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.primary,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#FFF',
  },
  footerNote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: SPACING['3xl'],
    lineHeight: 18,
    maxWidth: 280,
  },
  predictionContent: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.xl,
  },
  predictionBg: {
    ...StyleSheet.absoluteFillObject,
    height: width,
  },
  rocketIcon: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  predictionTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONTS.primary,
    marginBottom: SPACING['2xl'],
  },
  scoreOuter: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FBBF24',
  },
  scoreSubtext: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: SPACING['2xl'],
  },
  barrierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  barrierTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 1,
  },
  barrierDesc: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: SPACING.md,
  },
  analysisText: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    gap: 8,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.5,
  },
});
