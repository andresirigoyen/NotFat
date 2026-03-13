import React, { useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { COLORS, SPACING } from '@/constants/theme';

type SplashRouteParams = {
  Splash: {
    nextScreen?: string;
    duration?: number;
  };
};

export default function SplashScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SplashRouteParams, 'Splash'>>();

  useEffect(() => {
    const nextScreen = route.params?.nextScreen || 'Welcome';
    const duration = route.params?.duration || 2500;

    // Simular tiempo de carga de la app (e.g. validando sesión, cargando fuentes)
    const timer = setTimeout(() => {
      // Reemplazamos porque no queremos que el usuario vuelva al Splash usando el botón "Atrás"
      navigation.reset({
        index: 0,
        routes: [{ name: nextScreen as never }],
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [navigation, route]);

  return (
    <Animated.View 
      entering={FadeIn.duration(800)} 
      exiting={FadeOut.duration(800)}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/images/logo.png')} 
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
