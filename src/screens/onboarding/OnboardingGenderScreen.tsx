import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, FadeInUp
} from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useOnboardingStore } from '@/store/onboarding-store';
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
      color: '#FBBF24',
    },
    {
      id: 'female',
      label: 'Femenino',
      icon: 'woman' as keyof typeof Ionicons.glyphMap,
      description: 'Metabolismo base femenino',
      color: '#FBBF24',
    },
    {
      id: 'non_binary',
      label: 'No Binario',
      icon: 'person' as keyof typeof Ionicons.glyphMap,
      description: 'Cálculo metabólico neutro',
      color: '#FBBF24',
    },
    {
      id: 'other',
      label: 'Otro / Prefiero no decir',
      icon: 'ellipsis-horizontal-circle' as keyof typeof Ionicons.glyphMap,
      description: 'Cálculo metabólico estándar',
      color: '#FBBF24',
    },
  ], []);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const firstName = onboardingData?.onboarding_metadata?.first_name || '';
  
  useEffect(() => {
    analytics.trackScreenView('OnboardingGender');
  }, []);

  const handleGenderSelect = (genderId: string) => {
    setSelectedGender(genderId);
  };

  const handleContinue = async () => {
    if (!selectedGender) return;
    
    setIsLoading(true);
    try {
      if (user) {
        // Logged in: update DB
        if (updateProfile?.mutateAsync) {
          await updateProfile.mutateAsync({
            gender: selectedGender as any, 
            onboarding_step: 'birth_date',
          });
        }
      } else {
        // Anonymous: save to local store
        setOnboardingData({ gender: selectedGender as any });
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
            <Text style={styles.title}>
              {firstName ? `¡Hola, ${firstName}!` : '¿Cuál es tu sexo?'}
            </Text>
            <Text style={styles.subtitle}>
              Establece tu sexo biológico para calcular tu metabolismo con precisión.
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
            colors={selectedGender ? ['#FBBF24', '#D97706'] : ['#333', '#333']}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.buttonLayout}>
                <Text style={styles.continueButtonText}>Siguiente</Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={22} 
                  color="#000" 
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
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING['3xl'],
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
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  titleContainer: {
    marginBottom: SPACING.xl,
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
  },
  optionsGrid: {
    gap: SPACING.md,
  },
  optionCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    backgroundColor: '#111',
    borderWidth: 1.5,
    borderColor: '#222',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: FONTS.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
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
    borderColor: '#222',
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
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: '#222',
  },
  privacyIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
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
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonLoading: {
    opacity: 0.8,
  },
  continueButtonGradient: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    fontFamily: FONTS.primary,
  },
});
