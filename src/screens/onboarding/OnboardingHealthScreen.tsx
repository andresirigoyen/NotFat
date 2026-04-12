import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { healthService } from '@/services/healthService';

export default function OnboardingHealthScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const [isSyncing, setIsSyncing] = useState(false);

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingHealth' });
  }, [setOnboardingData]);

  const isAppleSynced = onboardingData.onboarding_metadata?.health_sync_enabled;
  const isSamsungSynced = onboardingData.onboarding_metadata?.samsung_health_enabled;
  const isGoogleSynced = onboardingData.onboarding_metadata?.google_fit_enabled;
  const isAnySynced = isAppleSynced || isSamsungSynced || isGoogleSynced;

  const handleSync = async () => {
    if (isAnySynced) {
      navigation.navigate('OnboardingPreferences' as never);
      return;
    }

    setIsSyncing(true);
    try {
      if (Platform.OS === 'ios') {
        const granted = await healthService.requestPermissions();
        if (granted) {
          setOnboardingData({
            onboarding_metadata: {
              ...(onboardingData.onboarding_metadata || {}),
              health_sync_enabled: true
            }
          });
        }
      } else {
        // Simulación para Android (Samsung / Google Fit)
        await new Promise(resolve => setTimeout(resolve, 1500));
        setOnboardingData({
          onboarding_metadata: {
            ...(onboardingData.onboarding_metadata || {}),
            google_fit_enabled: true
          }
        });
      }
      
      setTimeout(() => {
        setIsSyncing(false);
      }, 1500);
    } catch (error) {
      console.error('[Health] Sync error:', error);
      setIsSyncing(false);
    }
  };

  const handleSkip = () => {
    setOnboardingData({
      onboarding_metadata: {
        ...(onboardingData.onboarding_metadata || {}),
        health_sync_enabled: false
      }
    });
    navigation.navigate('OnboardingPreferences' as never);
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
            <View style={[styles.progressBar, { width: '65%' }]} />
          </View>
          <Text style={styles.progressLabel}>PASO 7 DE 10</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.titleSection}>
          <Text style={styles.title}>Sincroniza tu salud</Text>
          <Text style={styles.subtitle}>
            Conéctate con HealthKit para registrar automáticamente tus pasos y actividad para una experiencia mucho más precisa.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.2)', 'rgba(217, 119, 6, 0.05)']}
                style={styles.iconGradient}
              >
                <Ionicons name="heart" size={32} color="#FBBF24" />
              </LinearGradient>
            </View>
            <Text style={styles.cardTitle}>Todo en un mismo lugar</Text>
          </View>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#000" />
              </View>
              <Text style={styles.featureText}>Análisis de actividad en tiempo real</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#000" />
              </View>
              <Text style={styles.featureText}>Ajuste automático de calorías diarias</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#000" />
              </View>
              <Text style={styles.featureText}>Predicciones de metas más exactas</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.platformsSection}>
          <Text style={styles.platformsTitle}>PLATAFORMAS CONECTADAS</Text>
          <View style={styles.platformsList}>
            {isAppleSynced && (
              <Animated.View entering={FadeInDown} style={styles.platformBadge}>
                <Ionicons name="logo-apple" size={18} color="#FFF" />
                <Text style={styles.platformName}>Apple Health</Text>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Conectado</Text>
              </Animated.View>
            )}
            
            {isSamsungSynced && (
              <Animated.View entering={FadeInDown} style={[styles.platformBadge, { borderColor: 'rgba(5, 107, 255, 0.3)' }]}>
                <Ionicons name="fitness" size={18} color="#056BFF" />
                <Text style={styles.platformName}>Samsung Health</Text>
                <View style={[styles.connectedDot, { backgroundColor: '#056BFF', shadowColor: '#056BFF' }]} />
                <Text style={[styles.connectedText, { color: '#056BFF' }]}>Conectado</Text>
              </Animated.View>
            )}

            {isGoogleSynced && (
              <Animated.View entering={FadeInDown} style={[styles.platformBadge, { borderColor: 'rgba(52, 168, 83, 0.3)' }]}>
                <Ionicons name="heart-outline" size={18} color="#34A853" />
                <Text style={styles.platformName}>Google Fit</Text>
                <View style={[styles.connectedDot, { backgroundColor: '#34A853', shadowColor: '#34A853' }]} />
                <Text style={[styles.connectedText, { color: '#34A853' }]}>Conectado</Text>
              </Animated.View>
            )}

            {!isAnySynced && (
              <View style={styles.emptyPlatforms}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.emptyPlatformsText}>No hay plataformas conectadas todavía</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.privacySection}>
          <Ionicons name="shield-checkmark" size={18} color="#6B7280" />
          <Text style={styles.privacyText}>
            Tus datos de salud están encriptados y nunca se comparten. Tú controlas tu privacidad.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.mainButton, isSyncing && styles.buttonDisabled]} 
          onPress={handleSync}
          disabled={isSyncing}
        >
          <LinearGradient
            colors={['#FBBF24', '#D97706']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSyncing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {isAnySynced ? 'Continuar' : 'Conectar Datos de Salud'}
                </Text>
                <Ionicons 
                  name={isAnySynced ? 'arrow-forward' : 'pulse'} 
                  size={20} 
                  color="#000" 
                />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {!isAnySynced && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isSyncing}
          >
            <Text style={styles.skipText}>Lo haré más tarde</Text>
          </TouchableOpacity>
        )}
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
  },
  titleSection: {
    marginBottom: SPACING['2xl'],
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
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#0A0A0A',
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: SPACING.xl,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  featureList: {
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  mainButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: FONTS.primary,
  },
  skipButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  platformsSection: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  platformsTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4B5563',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  platformsList: {
    gap: SPACING.sm,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: '#222',
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: SPACING.sm,
    flex: 1,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  emptyPlatforms: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#333',
    gap: SPACING.sm,
  },
  emptyPlatformsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});
