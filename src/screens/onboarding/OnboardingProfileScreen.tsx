import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

// Sincronizado con Prisma: height_unit_enum
const HEIGHT_UNITS = [
  { id: 'cm', label: 'cm', description: 'Centímetros' },
  { id: 'm', label: 'm', description: 'Metros' },
  { id: 'in', label: 'in', description: 'Pulgadas' },
];

// Sincronizado con Prisma: weight_unit_enum
const WEIGHT_UNITS = [
  { id: 'kg', label: 'kg', description: 'Kilogramos' },
  { id: 'lb', label: 'lb', description: 'Libras' },
];

export default function OnboardingProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  
  // Estados para los campos del perfil (sincronizados con Prisma)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [heightValue, setHeightValue] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'm' | 'in'>('cm');
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = () => {
    if (!firstName.trim()) {
      Alert.alert('Nombre Requerido', 'Por favor ingresa tu nombre');
      return false;
    }

    if (!lastName.trim()) {
      Alert.alert('Apellido Requerido', 'Por favor ingresa tu apellido');
      return false;
    }

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

    if (heightUnit === 'm' && (height < 0.5 || height > 2.5)) {
      Alert.alert('Altura Inválida', 'La altura debe estar entre 0.5m y 2.5m');
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
    if (!user || !validateInputs()) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: profiles
      await updateProfile({
        first_name: firstName.trim(), // String?
        last_name: lastName.trim(), // String?
        height_value: parseFloat(heightValue), // Float?
        height_unit: heightUnit, // height_unit_enum
        weight_value: parseFloat(weightValue), // Float?
        weight_unit: weightUnit, // weight_unit_enum
        onboarding_step: 'activity',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // String?
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Cuéntanos sobre ti</Text>
            <Text style={styles.subtitle}>
              Tu información física nos ayuda a crear metas personalizadas
            </Text>
          </View>

          {/* Name Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nombre Completo</Text>
            
            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color={COLORS.text.muted} />
                <Text style={styles.inputLabel}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Tu nombre"
                  placeholderTextColor={COLORS.text.muted}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.text.muted} />
                <Text style={styles.inputLabel}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Tu apellido"
                  placeholderTextColor={COLORS.text.muted}
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>

          {/* Height Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Altura</Text>
            
            <View style={styles.measurementContainer}>
              <View style={styles.measurementInput}>
                <Ionicons name="resize" size={20} color={COLORS.text.muted} />
                <TextInput
                  style={styles.measurementValue}
                  value={heightValue}
                  onChangeText={setHeightValue}
                  placeholder="0"
                  placeholderTextColor={COLORS.text.muted}
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

          {/* Weight Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peso Actual</Text>
            
            <View style={styles.measurementContainer}>
              <View style={styles.measurementInput}>
                <Ionicons name="fitness" size={20} color={COLORS.text.muted} />
                <TextInput
                  style={styles.measurementValue}
                  value={weightValue}
                  onChangeText={setWeightValue}
                  placeholder="0"
                  placeholderTextColor={COLORS.text.muted}
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

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.text.muted} />
            <Text style={styles.privacyText}>
              Tu información es privada y solo se usa para personalizar tu experiencia
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!firstName || !lastName || !heightValue || !weightValue) && styles.continueButtonDisabled,
              isLoading && styles.continueButtonLoading
            ]}
            onPress={handleContinue}
            disabled={!firstName || !lastName || !heightValue || !weightValue || isLoading}
          >
            <LinearGradient
              colors={(firstName && lastName && heightValue && weightValue) ? [COLORS.primary.sky, '#0EA5E9'] : [COLORS.background.border, COLORS.background.border]}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Text style={styles.continueButtonText}>Guardando...</Text>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.text.primary} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background.border,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 2,
    marginLeft: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary.sky,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    lineHeight: 24,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    gap: SPACING.md,
  },
  inputContainer: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING['2xl'],
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    paddingTop: SPACING.lg,
  },
  measurementContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  measurementInput: {
    flex: 1,
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  measurementValue: {
    flex: 1,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    padding: SPACING.xs,
  },
  unitButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  unitButtonSelected: {
    backgroundColor: COLORS.primary.sky,
  },
  unitText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  unitTextSelected: {
    color: COLORS.text.primary,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  privacyText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.lg,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
});
