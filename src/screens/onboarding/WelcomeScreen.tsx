import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function WelcomeScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { data: onboardingData } = useOnboardingStore();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View entering={FadeIn.duration(1000)} style={styles.container}>
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=75&w=1200&auto=format&fit=crop' }} 
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000000']}
            locations={[0, 0.2, 0.6, 1]}
            style={styles.gradient}
          >
            <SafeAreaView style={styles.safeArea}>
              
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>NOT<Text style={{ color: '#FBBF24' }}>FAT</Text></Text>
                </View>
              </View>

              <View style={styles.bottomContent}>
                <Animated.View entering={FadeInDown.duration(800).delay(200)}>
                  <Text style={styles.title}>
                    Tu evolución física{'\n'}
                    <Text style={{ color: '#FBBF24' }}>comienza hoy.</Text>
                  </Text>
                  <Text style={styles.subtitle}>
                    Planificación nutricional de alta resolución impulsada por IA. Simple, potente y definitiva.
                  </Text>
                </Animated.View>

                <Animated.View entering={SlideInDown.springify().delay(500)}>
                  {onboardingData.last_visited_step && onboardingData.last_visited_step !== 'Welcome' ? (
                    <TouchableOpacity 
                      style={[styles.primaryButton, { marginBottom: SPACING.md }]}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate(onboardingData.last_visited_step as never)}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.buttonText}>Continuar progreso</Text>
                        <Ionicons name="refresh" size={20} color="#000" />
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity 
                    style={styles.primaryButton}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('OnboardingReferral' as never)}
                  >
                    <LinearGradient
                      colors={['#FBBF24', '#D97706']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.buttonText}>Comenzar ahora</Text>
                      <Ionicons name="arrow-forward" size={20} color="#000" />
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Login' as never)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      ¿Ya eres miembro? <Text style={styles.loginHighlight}>Inicia sesión</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

            </SafeAreaView>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  logoContainer: {
    padding: SPACING.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    fontFamily: FONTS.primary,
  },
  bottomContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONTS.primary,
    lineHeight: 48,
    marginBottom: SPACING.md,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: FONTS.primary,
    lineHeight: 24,
    marginBottom: SPACING['2xl'],
    opacity: 0.9,
  },
  primaryButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontFamily: FONTS.primary,
  },
  secondaryButton: {
    width: '100%',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: FONTS.primary,
    fontWeight: '500',
  },
  loginHighlight: {
    color: '#FBBF24',
    fontWeight: '700',
  },
});
