import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, FadeInUp
} from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { analytics } from '@/services/analytics';

// Componente de Tarjeta Simplificado
const OptionCard = ({ 
  option, selectedId, onPress, disabled, colors, styles
}: { 
  option: any, selectedId: string, onPress: () => void, disabled: boolean, colors: any, styles: any
}) => {
  const isSelected = selectedId === option.id;
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionCard,
        isSelected && { borderColor: option.color, backgroundColor: `${option.color}15`, borderWidth: 2 },
        pressed && !disabled && { opacity: 0.9 }
      ]}
    >
      <View style={styles.optionContent}>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isSelected ? option.color : colors.background.tertiary }
        ]}>
          <Ionicons 
            name={option.icon} 
            size={28} 
            color={isSelected ? '#FFFFFF' : colors.text.tertiary} 
          />
        </View>
        
        <View style={styles.optionText}>
          <Text style={[styles.optionLabel, isSelected && { color: colors.text.primary }]}>
            {option.label}
          </Text>
          <Text style={styles.optionDescription}>
            {option.description}
          </Text>
        </View>
        
        <View style={styles.selectorContainer}>
          <View style={[
            styles.selectorOuter, 
            isSelected && { borderColor: option.color }
          ]}>
            {isSelected && (
              <View style={[styles.selectorInner, { backgroundColor: option.color }]} />
            )}
          </View>
        </View>
      </View>
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
      description: 'Metabolismo base masculino',
      color: '#38BDF8',
    },
    {
      id: 'female',
      label: 'Femenino',
      icon: 'woman' as keyof typeof Ionicons.glyphMap,
      description: 'Metabolismo base femenino',
      color: '#F472B6',
    },
    {
      id: 'non_binary',
      label: 'No Binario',
      icon: 'person' as keyof typeof Ionicons.glyphMap,
      description: 'Identidad no binarie',
      color: '#A78BFA',
    },
    {
      id: 'other',
      label: 'Otro / Prefiero no decir',
      icon: 'ellipsis-horizontal-circle' as keyof typeof Ionicons.glyphMap,
      description: 'Otras identidades',
      color: colors.text.muted,
    },
  ], [colors]);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    analytics.trackScreenView('OnboardingGender');
  }, []);

  const handleGenderSelect = (genderId: string) => {
    setSelectedGender(genderId);
  };

  const handleContinue = async () => {
    if (!selectedGender) return;
    
    if (!user) {
      Alert.alert('Sesión Requerida', 'Tu sesión ha expirado.');
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
      Alert.alert('Error', 'No pudimos guardar tu preferencia.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Sin Animación de Progreso Compleja */}
        <View style={styles.header}>
          <Pressable 
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.reset({ index: 0, routes: [{ name: 'Welcome' as never }] })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Pressable>
          
          <View style={styles.progressWrapper}>
            <View style={styles.progressBackground}>
              <View style={[styles.progressBar, { width: '20%' }]} />
            </View>
            <Text style={styles.progressLabel}>PASO 1 DE 8</Text>
          </View>
        </View>

        {/* Contenido Principal */}
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>¿Cuál es tu sexo?</Text>
            <Text style={styles.subtitle}>
              Establece tu sexo biológico para cálculos metabólicos precisos.
            </Text>
          </View>

          {/* Opciones */}
          <View style={styles.optionsGrid}>
            {GENDER_OPTIONS.map((option) => (
              <OptionCard 
                key={option.id}
                option={option} 
                selectedId={selectedGender} 
                onPress={() => handleGenderSelect(option.id)} 
                disabled={isLoading}
                colors={colors}
                styles={styles}
              />
            ))}
          </View>

          {/* Privacidad */}
          <View style={styles.privacyCard}>
            <View style={styles.privacyIconBg}>
              <Ionicons name="lock-closed" size={16} color={colors.primary.sky} />
            </View>
            <Text style={styles.privacyText}>
              Tus datos son privados y seguros.
            </Text>
          </View>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            !selectedGender && styles.continueButtonDisabled,
            isLoading && styles.continueButtonLoading,
            pressed && selectedGender && { opacity: 0.9 }
          ]}
          onPress={handleContinue}
          disabled={!selectedGender || isLoading}
        >
          <LinearGradient
            colors={selectedGender ? ['#0EA5E9', '#0284C7'] : [colors.background.tertiary, colors.background.tertiary]}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <Text style={styles.continueButtonText}>Cargando...</Text>
            ) : (
              <View style={styles.buttonLayout}>
                <Text style={[styles.continueButtonText, !selectedGender && { color: colors.text.muted }]}>
                  Siguiente
                </Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={20} 
                  color={selectedGender ? '#FFFFFF' : colors.text.muted} 
                />
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  progressWrapper: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  progressBackground: {
    height: 4,
    backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  titleContainer: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: '800',
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    lineHeight: 22,
  },
  optionsGrid: {
    gap: SPACING.md,
  },
  optionCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    backgroundColor: colors.background.card,
    borderWidth: 1.5,
    borderColor: colors.background.border,
    ...SHADOWS.sm,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: FONTS.sizes.xs,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
  },
  selectorContainer: {
    paddingLeft: SPACING.sm,
  },
  selectorOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.background.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#F8FAFC',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  privacyIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  privacyText: {
    fontSize: 12,
    color: colors.text.muted,
    flex: 1,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonLoading: {
    opacity: 0.8,
  },
  continueButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },
});
