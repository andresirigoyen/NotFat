import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SPACING } from '@/constants/theme';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';

type SplashRouteParams = {
  Splash: {
    nextScreen?: string;
    duration?: number;
  };
};

export default function SplashScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const route = useRoute<RouteProp<SplashRouteParams, 'Splash'>>();
  const { user, loading: authLoading } = useAuthStore();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigationTriggered = useRef(false);

  const nextScreen = useMemo(() => {
    // Explicit override (used by Welcome close button)
    if (route.params?.nextScreen) return route.params.nextScreen;

    if (!user) return 'Welcome';
    
    // Si todavía estamos cargando el perfil, no tomamos una decisión definitiva
    if (profileLoading) return 'Splash';

    if (!profile) return 'OnboardingGender';
    if (profile.onboarding_completed) return 'Main';

    const step = profile.onboarding_step || 'gender';
    switch (step) {
      case 'gender':
        return 'OnboardingGender';
      case 'birth_date':
        return 'OnboardingBirthDate';
      case 'goals':
        return 'OnboardingGoals';
      case 'profile':
        return 'OnboardingProfile';
      case 'activity':
        return 'OnboardingActivity';
      case 'preferences':
        return 'OnboardingPreferences';
      case 'completed':
        return 'Main';
      default:
        return 'OnboardingGender';
    }
  }, [profile, profileLoading, route.params?.nextScreen, user]);

  useEffect(() => {
    const duration = route.params?.duration || 1200;

    // Fallback de seguridad: Si después de 6 segundos seguimos cargando, forzamos navegación
    const safetyTimer = setTimeout(() => {
      if (!navigationTriggered.current && (authLoading || profileLoading)) {
        console.warn('[Splash] Safety fallback triggered');
        navigationTriggered.current = true;
        navigation.reset({
          index: 0,
          routes: [{ name: (nextScreen === 'Splash' ? 'Welcome' : nextScreen) as any }],
        });
      }
    }, 6000);

    // No navegar si todavía estamos resolviendo estados críticos
    if (!route.params?.nextScreen && (authLoading || profileLoading || nextScreen === 'Splash')) {
      return;
    }

    // No navegar si ya se inició una transición
    if (navigationTriggered.current) return;

    const timer = setTimeout(() => {
      if (navigationTriggered.current) return;
      navigationTriggered.current = true;
      
      navigation.reset({
        index: 0,
        routes: [{ name: nextScreen as never }],
      });
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [authLoading, navigation, nextScreen, profileLoading, route.params?.duration, route.params?.nextScreen]);

  return (
    <Animated.View 
      entering={FadeIn.duration(800)} 
      exiting={FadeOut.duration(800)}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/images/NotFat.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <ActivityIndicator 
          size="large" 
          color={colors.primary.amber} 
          style={styles.spinner} 
        />
      </View>
    </Animated.View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fondo completamente negro
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200, // Logo mucho más pequeño
    height: 80,
    marginBottom: SPACING['3xl'], // Espacio entre el logo y el spinner
  },
  spinner: {
    marginTop: SPACING.xl,
    transform: [{ scale: 1.2 }], // Spinner un poquito más grande para mejor feedback
  }
});
