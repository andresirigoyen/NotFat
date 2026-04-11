import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeIn, FadeInDown, FadeInUp, FadeInRight, FadeOut, 
  useSharedValue, useAnimatedStyle, withSpring, withTiming
} from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { analytics } from '@/services/analytics';

// Se define dentro del componente

// Animacion Individual para Boton
const AnimatedOptionCard = ({ 
  option, selectedId, onPress, disabled, colors, styles
}: { 
  option: any, selectedId: string, onPress: () => void, disabled: boolean, colors: any, styles: any
}) => {
  const isSelected = selectedId === option.id;
  const scale = useSharedValue(1);
  
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: withTiming(isSelected ? option.color : colors.background.border, { duration: 200 }),
    backgroundColor: withTiming(isSelected ? 'rgba(255,255,255,0.03)' : colors.background.card, { duration: 200 })
  }));

  const animatedIconBgStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isSelected ? option.color : colors.background.tertiary, { duration: 300 })
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 10, stiffness: 200 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }) }}
    >
      <Animated.View style={[styles.optionCard, isSelected && styles.optionCardSelected, animatedCardStyle]}>
        <View style={styles.optionContent}>
          
          <Animated.View style={[styles.iconContainer, animatedIconBgStyle]}>
            <Ionicons 
              name={option.icon} 
              size={32} 
              color={isSelected ? colors.background.primary : colors.text.secondary} 
            />
          </Animated.View>
          
          <View style={styles.optionText}>
            <Text style={[styles.optionLabel, isSelected && { color: option.color }]}>
              {option.label}
            </Text>
            <Text style={styles.optionDescription}>
              {option.description}
            </Text>
          </View>
          
          {isSelected && (
            <Animated.View entering={FadeInRight.duration(300).springify()} exiting={FadeOut} style={styles.checkContainer}>
              <Ionicons name="checkmark-circle" size={28} color={option.color} />
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

export default function OnboardingGenderScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const GENDER_OPTIONS = React.useMemo(() => [
    {
      id: 'male',
      label: 'Masculino',
      icon: 'man' as keyof typeof Ionicons.glyphMap,
      description: 'Hombre',
      color: colors.primary.sky,
    },
    {
      id: 'female',
      label: 'Femenino',
      icon: 'woman' as keyof typeof Ionicons.glyphMap,
      description: 'Mujer',
      color: '#EC4899', // Pink
    },
    {
      id: 'non_binary',
      label: 'No Binario',
      icon: 'person' as keyof typeof Ionicons.glyphMap,
      description: 'No binario',
      color: colors.primary.amber,
    },
    {
      id: 'other',
      label: 'Otro',
      icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
      description: 'Otro / Prefiero no decir',
      color: colors.text.secondary,
    },
  ], [colors]);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  // Progreso Animado
  const progressWidth = useSharedValue(0);

  // useEffect para analytics
  useEffect(() => {
    analytics.trackScreenView('OnboardingGender');
    progressWidth.value = withSpring(25, { damping: 12, stiffness: 90 });
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  const handleGenderSelect = (genderId: string) => {
    setSelectedGender(genderId);
    progressWidth.value = withSpring(35, { damping: 12, stiffness: 90 });
  };

  const handleContinue = async () => {
    if (!selectedGender) return;
    
    if (!user) {
      Alert.alert(
        'Sesión Requerida',
        'Tu sesión ha expirado o no se ha cargado correctamente. Por favor intenta reiniciar la aplicación.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      if (updateProfile?.mutateAsync) {
        await updateProfile.mutateAsync({
          gender: selectedGender as any, 
          onboarding_step: 'birth_date',
        });
      }
      analytics.trackOnboardingStep('gender', { gender: selectedGender });
      navigation.navigate('OnboardingBirthDate' as never);
    } catch (error: any) {
      console.error('Error updating gender:', error);
      Alert.alert(
        'Error',
        'No pudimos guardar tu preferencia. Por favor verifica tu conexión e intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Header Animado */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <Pressable 
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Force return to Welcome by resetting the stack
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' as never }],
                });
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
        </Animated.View>

        {/* Contenido Principal */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.titleSection}>
            <Text style={styles.title}>¿Cuál es tu sexo?</Text>
            <Text style={styles.subtitle}>
              Esta información nos ayuda a medir de manera precisa tu consumo metabólico (TMB).
            </Text>
          </Animated.View>

          {/* Opciones de Género Escaladas e Interactivas */}
          <View style={styles.optionsContainer}>
            {GENDER_OPTIONS.map((option, index) => (
              <Animated.View key={option.id} entering={FadeInDown.duration(600).delay(400 + (index * 150))}>
                <AnimatedOptionCard 
                  option={option} 
                  selectedId={selectedGender} 
                  onPress={() => handleGenderSelect(option.id)} 
                  disabled={isLoading}
                  colors={colors}
                  styles={styles}
                />
              </Animated.View>
            ))}
          </View>

          {/* Nota de Privacidad */}
          <Animated.View entering={FadeIn.duration(800).delay(1000)} style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary.sky} />
            <Text style={styles.privacyText}>
              Protegemos tu privacidad y solo usamos esto para calcular tu perfil nutricional real.
            </Text>
          </Animated.View>
        </View>

        {/* Footer con Boton de Acción Fluido */}
        <Animated.View entering={FadeInUp.duration(800).delay(1200)} style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              !selectedGender && styles.continueButtonDisabled,
              isLoading && styles.continueButtonLoading,
              pressed && selectedGender && { transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleContinue}
            disabled={!selectedGender || isLoading}
          >
            <LinearGradient
              colors={selectedGender ? [colors.primary.sky, '#0284C7'] : [colors.background.border, colors.background.border]}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Text style={styles.continueButtonText}>Guardando...</Text>
              ) : (
                <View style={styles.continueButtonContent}>
                  <Text style={[styles.continueButtonText, !selectedGender && { color: colors.text.muted }]}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={24} color={selectedGender ? colors.background.primary : colors.text.muted} />
                </View>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 3,
    marginLeft: SPACING.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.sky,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleSection: {
    marginBottom: SPACING['2xl'],
    paddingTop: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes['4xl'],
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  optionCard: {
    backgroundColor: colors.background.card,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: colors.background.border,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  optionCardSelected: {
    ...SHADOWS.lg,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
  },
  checkContainer: {
    marginLeft: SPACING.sm,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  privacyText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.md,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['2xl'],
    paddingTop: SPACING.xl,
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonLoading: {
    opacity: 0.8,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  continueButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: colors.background.primary,
    fontFamily: FONTS.primary,
  },
});
