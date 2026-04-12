import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, StackActions } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { supabase } from '@/services/SupabaseContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS } from '@/constants/theme';
import { Sparkles, Target, ShieldCheck, Brain, Rocket } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/hooks/useNotifications';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function OnboardingGeneratingPlanScreen() {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { data: localData, reset } = useOnboardingStore();
  const notifications = useNotifications();
  const [status, setStatus] = useState('Analizando tu perfil biológico...');
  const [showPrediction, setShowPrediction] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);

  useEffect(() => {
    const calculateLocalFallback = async () => {
      if (!localData) return;
      
      const weight = localData.weight_value || 70;
      const height = localData.height_value || 170;
      const age = 30;
      const gender = localData.gender || 'male';
      const goal = localData.nutrition_goal || 'maintain_weight';
      
      let bmr = (10 * weight) + (6.25 * height) - (5 * age);
      bmr = gender === 'male' ? bmr + 5 : bmr - 161;
      
      const maintenanceCals = bmr * 1.375; // Active Moderate
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
        mensaje_analisis: 'Basado en tu perfil, tienes una alta probabilidad de éxito si mantienes el registro diario.'
      };
    };

    const generatePlan = async () => {
      try {
        await supabase.from('profiles').update({
          onboarding_step: 'generating_plan',
          onboarding_completed: false
        }).eq('id', user!.id);

        const startTime = Date.now();
        
        setTimeout(() => setStatus('Calculando TDEE y macronutrientes...'), 1200);
        setTimeout(() => setStatus('Identificando hacks conductuales...'), 2500);
        setTimeout(() => setStatus('Validando límites de seguridad metabólica...'), 3800);

        const { data, error } = await supabase.functions.invoke('generate-nutritional-plan', {
          body: { userId: user!.id },
          headers: { 'x-timeout': '5000' }
        });

        if (error || !data) {
          throw new Error(error?.message || 'Empty response');
        }

        const executionTime = Date.now() - startTime;
        const minDelay = 4500;
        if (executionTime < minDelay) {
          await new Promise(resolve => setTimeout(resolve, minDelay - executionTime));
        }

        // Calcular target_date dinámicamente si hay semanas estimadas
        if (data.plan_nutricional?.semanas_estimadas) {
          const weeks = data.plan_nutricional.semanas_estimadas;
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + (weeks * 7));
          
          await supabase.from('profiles').update({
            target_date: targetDate.toISOString().split('T')[0]
          }).eq('id', user!.id);
          console.log('[Onboarding] Dynamic target_date calculated:', targetDate.toISOString().split('T')[0]);
        }

        if (data.prediccion_exito) {
          setPredictionData(data.prediccion_exito);
          setShowPrediction(true);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('[Onboarding] Plan generated by AI');
        reset();
      } catch (e: any) {
        console.warn('[Onboarding] AI Plan failed or timed out, using local fallback:', e.message);
        const fallbackPrediction = await calculateLocalFallback();
        
        setPredictionData(fallbackPrediction);
        setShowPrediction(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        reset();
      } finally {
        try {
          const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'amigo';
          await notifications.schedulePushNotification(
            '¡Plan en marcha! 🚀',
            `¡${userName}, tu plan ya está listo! No olvides registrar tu próxima comida para empezar tu racha con éxito.`,
            2 * 60 * 60
          );
        } catch (notifErr) {
          console.warn('[Onboarding] Failed to schedule retention notification:', notifErr);
        }

        setTimeout(() => {
          navigation.dispatch(StackActions.replace('Main'));
        }, 1000);
      }
    };

    generatePlan();
  }, [user, localData, navigation, notifications, reset]);

  return (
    <SafeAreaView style={styles.container}>
      {showPrediction ? (
        <Animated.View entering={FadeIn.duration(800)} style={styles.predictionContainer}>
          <Rocket size={48} color="#FBBF24" style={styles.predictionIcon} />
          <Text style={styles.predictionTitle}>Tu Predicción de Éxito</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreText}>{predictionData?.porcentaje}%</Text>
            <Text style={styles.scoreSubtext}>probabilidad</Text>
          </View>

          <View style={styles.barrierBox}>
            <Brain size={20} color="#FBBF24" />
            <Text style={styles.barrierLabel}>Reto Detectado:</Text>
            <Text style={styles.barrierText}>{predictionData?.barrera_principal}</Text>
          </View>

          <Text style={styles.predictionAnalysis}>
            {predictionData?.mensaje_analisis}
          </Text>

          <View style={styles.successBadge}>
            <ShieldCheck size={16} color="#000" />
            <Text style={styles.successBadgeText}>PLAN BLINDADO ANTIRREBOTE</Text>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FBBF24" />
          <Animated.Text entering={FadeIn.duration(500).delay(200)} style={styles.statusText}>
            {status}
          </Animated.Text>
          <Text style={styles.subText}>Estamos cocinando tu plan de nutrición perfecto...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  subText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  predictionContainer: {
    padding: 30,
    alignItems: 'center',
    width: '100%',
  },
  predictionIcon: {
    marginBottom: 20,
  },
  predictionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FBBF24',
  },
  scoreSubtext: {
    fontSize: 12,
    color: '#FBBF24',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  barrierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 20,
    width: '100%',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  barrierLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
  },
  barrierText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '800',
    flex: 1,
  },
  predictionAnalysis: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  successBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
  },
});
