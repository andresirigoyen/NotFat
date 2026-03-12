import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Breve delay inicial para suavizar el montaje
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.container}>
        <ImageBackground 
          source={require('../../../assets/images/welcome.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)', '#000000']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.gradient}
          >
            <SafeAreaView style={styles.safeArea}>
              
              {/* Header: Close Button only */}
              <View style={styles.header}>
                <View style={{ flex: 1 }} /> {/* Espaciador para mantener Close Button a la derecha */}
                
                <TouchableOpacity 
                  style={styles.closeButton}
                  activeOpacity={0.7}
                  onPress={() => (navigation.navigate as any)('Splash', { nextScreen: 'Login', duration: 4500 })}
                >
                  <Ionicons name="close" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Bottom Content */}
              <View style={styles.bottomContent}>
                <Animated.View entering={FadeInDown.duration(800).delay(200)}>
                  <Text style={styles.subtitle}>
                    Experimenta una movilidad fluida en tu nutrición. Tu compañero definitivo.
                  </Text>
                </Animated.View>

                <Animated.View entering={SlideInDown.springify().delay(500)}>
                  <TouchableOpacity 
                    style={styles.button}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('OnboardingGender' as never)}
                  >
                    <Text style={styles.buttonText}>Continuar</Text>
                    
                    {/* Flechas indicativas estilo Uber reference */}
                    <View style={styles.iconContainer}>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.background.primary} />
                      <Ionicons name="chevron-forward" size={16} color={COLORS.background.primary} style={{ marginLeft: -8, opacity: 0.6 }} />
                      <Ionicons name="chevron-forward" size={16} color={COLORS.background.primary} style={{ marginLeft: -8, opacity: 0.3 }} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Login' as never)}
                  >
                    <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: '#A0A0A0', 
    fontFamily: FONTS.primary,
    lineHeight: 22,
    marginBottom: SPACING.xl * 1.5, 
    paddingRight: SPACING.lg, 
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary.amber, 
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.background.primary, 
    fontFamily: FONTS.primary,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
  },
  secondaryButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
});
