import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS, SPACING } from '@/constants/theme';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';

type SplashRouteParams = {
  Splash: {
    nextScreen?: string;
    duration?: number;
  };
};

export default function SplashScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SplashRouteParams, 'Splash'>>();
  const { user, loading: authLoading } = useAuthStore();
  const { profile, isLoading: profileLoading } = useProfile();

  const nextScreen = useMemo(() => {
    // Explicit override (used by Welcome close button)
    if (route.params?.nextScreen) return route.params.nextScreen;

    if (!user) return 'Welcome';
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
  }, [profile, route.params?.nextScreen, user]);

  useEffect(() => {
    const duration = route.params?.duration || 1200;

    // Wait for auth/profile resolution unless explicit override
    if (!route.params?.nextScreen && (authLoading || profileLoading)) return;

    // Simular tiempo de carga de la app (e.g. validando sesión, cargando fuentes)
    const timer = setTimeout(() => {
      // Reemplazamos porque no queremos que el usuario vuelva al Splash usando el botón "Atrás"
      navigation.reset({
        index: 0,
        routes: [{ name: nextScreen as never }],
      });
    }, duration);

    return () => clearTimeout(timer);
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
          color={COLORS.primary.amber} 
          style={styles.spinner} 
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
