import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

export default function OnboardingHealthScreen() {
  const { isDark } = useThemeColors();
  const navigation = useNavigation();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const [isSyncing, setIsSyncing] = useState(false);

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingHealth' });
  }, [setOnboardingData]);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simular integración con HealthKit/Google Fit
    // En un entorno real, aquí se llamarían a los servicios correspondientes
    setTimeout(() => {
      setOnboardingData({
        onboarding_metadata: {
          ...(onboardingData.onboarding_metadata || {}),
          health_sync_enabled: true
        }
      });
      setIsSyncing(false);
      navigation.navigate('OnboardingPreferences' as never);
    }, 1500);
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
          <Text style={styles.progressLabel}>SMART SYNC</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(800)}>
          <Text style={styles.title}>Let's sync with your health data</Text>
          <Text style={styles.subtitle}>
            Connect with HealthKit to automatically track your steps and activity for a much more precise coaching experience.
          </Text>
        </Animated.View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons name="heart" size={32} color="#EF4444" />
            </View>
            <Text style={styles.cardTitle}>Everything in one place</Text>
          </View>
          
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Ionicons name="stats-chart" size={16} color="#FBBF24" />
              <Text style={styles.bulletText}>Real-time activity analysis</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="flame" size={16} color="#FBBF24" />
              <Text style={styles.bulletText}>Automatic calorie adjustment</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-done" size={16} color="#FBBF24" />
              <Text style={styles.bulletText}>Better goal predictions</Text>
            </View>
          </View>
        </View>

        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={16} color="#6B7280" />
          <Text style={styles.securityText}>
            Your health data is encrypted and never shared. You control your privacy.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.buttonMain} 
          onPress={handleSync}
          disabled={isSyncing}
        >
          <LinearGradient
            colors={['#FBBF24', '#D97706']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>
              {isSyncing ? 'Connecting...' : 'Connect Health Data'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.buttonSecondary}
          onPress={handleSkip}
          disabled={isSyncing}
        >
          <Text style={styles.buttonSecondaryText}>I'll do it later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
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
    marginBottom: SPACING['2xl'],
  },
  card: {
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  bulletList: {
    gap: SPACING.md,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bulletText: {
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    opacity: 0.6,
  },
  securityText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonMain: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  gradient: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontFamily: FONTS.primary,
  },
  buttonSecondary: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
