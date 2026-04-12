import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useOnboardingStore } from '@/store/onboarding-store';
import { analytics } from '@/services/analytics';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

// Sincronizado con Prisma: height_unit_enum
const HEIGHT_UNITS = [
  { id: 'cm', label: 'cm', description: 'Centímetros' },
  { id: 'in', label: 'in', description: 'Pulgadas' },
];

// Sincronizado con Prisma: weight_unit_enum
const WEIGHT_UNITS = [
  { id: 'kg', label: 'kg', description: 'Kilogramos' },
  { id: 'lb', label: 'lb', description: 'Libras' },
];

export default function OnboardingProfileScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const { setData: setOnboardingData } = useOnboardingStore();
  
  // Estados para los campos del perfil (sincronizados con Prisma)
  // Estados para los campos del perfil (sincronizados con Prisma)
  const [heightValue, setHeightValue] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingProfile' });
  }, []);

  const { data: onboardingData } = useOnboardingStore();
  const userName = onboardingData?.onboarding_metadata?.first_name || '';

  const validateInputs = () => {
    if (!heightValue || parseFloat(heightValue) <= 0) {
      Alert.alert('Altura Inválida', 'Por favor ingresa una altura válida');
      return false;
    }

    if (!weightValue || parseFloat(weightValue) <= 0) {
      Alert.alert('Peso Inválido', 'Por favor ingresa un peso válido');
      return false;
    }

    // Validaciones de rangos
    const height = parseFloat(heightValue);
    const weight = parseFloat(weightValue);

    if (heightUnit === 'cm' && (height < 50 || height > 250)) {
      Alert.alert('Altura Inválida', 'La altura debe estar entre 50cm y 250cm');
      return false;
    }

    if (heightUnit === 'in' && (height < 20 || height > 100)) {
      Alert.alert('Altura Inválida', 'La altura debe estar entre 20in y 100in');
      return false;
    }

    if (weightUnit === 'kg' && (weight < 20 || weight > 300)) {
      Alert.alert('Peso Inválido', 'El peso debe estar entre 20kg y 300kg');
      return false;
    }

    if (weightUnit === 'lb' && (weight < 44 || weight > 660)) {
      Alert.alert('Peso Inválido', 'El peso debe estar entre 44lb y 660lb');
      return false;
    }

    return true;
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Sincronizado con Prisma: profiles
        await updateProfile.mutateAsync({
          height_value: parseFloat(heightValue),
          height_unit: heightUnit,
          weight_value: parseFloat(weightValue),
          weight_unit: weightUnit,
          onboarding_step: 'activity',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else {
        // Almacenamiento local temporal
        setOnboardingData({
          height_value: parseFloat(heightValue),
          height_unit: heightUnit,
          weight_value: parseFloat(weightValue),
          weight_unit: weightUnit,
        });
      }

      analytics.trackOnboardingStep('profile', {
        height_value: parseFloat(heightValue),
        height_unit: heightUnit,
        weight_value: parseFloat(weightValue),
        weight_unit: weightUnit,
      });

      navigation.navigate('OnboardingActivity' as never);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No pudimos guardar tu información. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.progressWrapper}>
             <View style={styles.progressBackground}>
               <View style={[styles.progressBar, { width: '40%' }]} />
             </View>
             <Text style={styles.progressLabel}>PASO 4 DE 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {userName ? `¡Ya casi, ${userName}!` : 'Datos Físicos'}
            </Text>
            <Text style={styles.subtitle}>
              Tu altura y peso son esenciales para calcular tus macros.
            </Text>
          </View>

          <View style={styles.measurementCard}>
            <Text style={styles.measurementLabel}>Tu altura</Text>
            <View style={styles.measurementLayout}>
              <View style={styles.inputBox}>
                 <TextInput
                  style={styles.input}
                  value={heightValue}
                  onChangeText={setHeightValue}
                  placeholder="0"
                  placeholderTextColor="#333"
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
              <View style={styles.unitSelector}>
                {HEIGHT_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitButton,
                      heightUnit === unit.id && styles.unitButtonSelected
                    ]}
                    onPress={() => setHeightUnit(unit.id as any)}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.unitText,
                      heightUnit === unit.id && styles.unitTextSelected
                    ]}>
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.measurementCard}>
            <Text style={styles.measurementLabel}>Peso Actual</Text>
            <View style={styles.measurementLayout}>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={weightValue}
                  onChangeText={setWeightValue}
                  placeholder="0"
                  placeholderTextColor="#333"
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
              <View style={styles.unitSelector}>
                {WEIGHT_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitButton,
                      weightUnit === unit.id && styles.unitButtonSelected
                    ]}
                    onPress={() => setWeightUnit(unit.id as any)}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.unitText,
                      weightUnit === unit.id && styles.unitTextSelected
                    ]}>
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.privacyCard}>
            <Ionicons name="lock-closed" size={16} color="#FBBF24" />
            <Text style={styles.privacyText}>
              Tu información es privada y solo se usa para personalizar tu experiencia
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!heightValue || !weightValue) && styles.continueButtonDisabled,
              isLoading && styles.continueButtonLoading
            ]}
            onPress={handleContinue}
            disabled={!heightValue || !weightValue || isLoading}
          >
            <LinearGradient
              colors={(heightValue && weightValue) ? ['#FBBF24', '#D97706'] : ['#333', '#333']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.buttonLayout}>
                  <Text style={styles.continueButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  titleSection: {
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
  measurementCard: {
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#222',
  },
  measurementLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  measurementLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  inputBox: {
    flex: 1,
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  input: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: FONTS.primary,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  unitButtonSelected: {
    backgroundColor: '#FBBF24',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  unitTextSelected: {
    color: '#000',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#222',
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: SPACING.sm,
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
