import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

// Sincronizado con Prisma: water_unit_enum
const WATER_UNITS = [
  { id: 'ml', label: 'ml', description: 'Mililitros' },
  { id: 'oz', label: 'oz', description: 'Onzas líquidas' },
];

// Sincronizado con Prisma: profiles.preferred_bottle_size (Int @default(1000))
const BOTTLE_SIZES = {
  ml: [250, 500, 750, 1000, 1500],
  oz: [8, 16, 24, 32, 50],
};

export default function OnboardingPreferencesScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  
  // Estados para preferencias (sincronizados con Prisma)
  const [preferredBottleUnit, setPreferredBottleUnit] = useState<'ml' | 'oz'>('ml');
  const [preferredBottleSize, setPreferredBottleSize] = useState<number>(1000);
  const [showCalories, setShowCalories] = useState<boolean>(true);
  const [showHydration, setShowHydration] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  const availableBottleSizes = BOTTLE_SIZES[preferredBottleUnit];

  const handleContinue = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Sincronizado con Prisma: profiles
      await updateProfile.mutateAsync({
        preferred_bottle_size: preferredBottleSize, // Int @default(1000)
        preferred_bottle_unit: preferredBottleUnit, // water_unit_enum
        show_calories: showCalories, // Boolean @default(true)
        show_hydration: showHydration, // Boolean @default(true)
        onboarding_step: 'completed',
        onboarding_completed: true, // Boolean?
      });

      // Navegar a la pantalla principal
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never }],
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBottleSize = (size: number, unit: 'ml' | 'oz') => {
    if (unit === 'ml') {
      return `${size}ml`;
    } else {
      return `${size}oz`;
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
            <View style={[styles.progressBar, { width: '100%' }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Preferencias Finales</Text>
            <Text style={styles.subtitle}>
              Personaliza tu experiencia con estas configuraciones
            </Text>
          </View>

          {/* Hydration Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuración de Hidratación</Text>
            
            <View style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <Ionicons name="water" size={24} color={COLORS.primary.sky} />
                <Text style={styles.preferenceTitle}>Unidad de Medida</Text>
              </View>
              
              <View style={styles.unitSelector}>
                {WATER_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitButton,
                      preferredBottleUnit === unit.id && styles.unitButtonSelected
                    ]}
                    onPress={() => setPreferredBottleUnit(unit.id as any)}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.unitText,
                      preferredBottleUnit === unit.id && styles.unitTextSelected
                    ]}>
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <Ionicons name="wine" size={24} color={COLORS.primary.amber} />
                <Text style={styles.preferenceTitle}>Tamaño de Botella Preferido</Text>
              </View>
              
              <View style={styles.bottleGrid}>
                {availableBottleSizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.bottleCard,
                      preferredBottleSize === size && styles.bottleCardSelected,
                      { borderColor: preferredBottleSize === size ? COLORS.primary.sky : COLORS.background.border }
                    ]}
                    onPress={() => setPreferredBottleSize(size)}
                    disabled={isLoading}
                  >
                    <View style={[
                      styles.bottleIcon,
                      { backgroundColor: preferredBottleSize === size ? `${COLORS.primary.sky}20` : COLORS.background.tertiary }
                    ]}>
                      <Ionicons 
                        name="water" 
                        size={20} 
                        color={preferredBottleSize === size ? COLORS.primary.sky : COLORS.text.secondary} 
                      />
                    </View>
                    <Text style={[
                      styles.bottleSize,
                      preferredBottleSize === size && styles.bottleSizeSelected
                    ]}>
                      {formatBottleSize(size, preferredBottleUnit)}
                    </Text>
                    {preferredBottleSize === size && (
                      <View style={styles.bottleCheck}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.primary.sky} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Display Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferencias de Visualización</Text>
            
            <View style={styles.preferenceCard}>
              <View style={styles.switchContainer}>
                <View style={styles.switchContent}>
                  <Ionicons name="flame" size={20} color={COLORS.status.error} />
                  <View style={styles.switchText}>
                    <Text style={styles.switchTitle}>Mostrar Calorías</Text>
                    <Text style={styles.switchDescription}>
                      Ver información calórica en comidas y resumen
                    </Text>
                  </View>
                </View>
                <Switch
                  value={showCalories}
                  onValueChange={setShowCalories}
                  trackColor={{ false: COLORS.background.border, true: COLORS.status.error }}
                  thumbColor={COLORS.text.primary}
                  disabled={isLoading}
                />
              </View>
            </View>

            <View style={styles.preferenceCard}>
              <View style={styles.switchContainer}>
                <View style={styles.switchContent}>
                  <Ionicons name="water" size={20} color={COLORS.primary.sky} />
                  <View style={styles.switchText}>
                    <Text style={styles.switchTitle}>Mostrar Hidratación</Text>
                    <Text style={styles.switchDescription}>
                      Ver seguimiento de agua en dashboard
                    </Text>
                  </View>
                </View>
                <Switch
                  value={showHydration}
                  onValueChange={setShowHydration}
                  trackColor={{ false: COLORS.background.border, true: COLORS.primary.sky }}
                  thumbColor={COLORS.text.primary}
                  disabled={isLoading}
                />
              </View>
            </View>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[COLORS.primary.sky, '#0EA5E9']}
              style={styles.summaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryContent}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.text.primary} />
                <Text style={styles.summaryTitle}>¡Todo Listo!</Text>
                <Text style={styles.summaryDescription}>
                  Tu perfil está completo. Vamos a personalizar tu experiencia.
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={COLORS.text.muted} />
            <Text style={styles.privacyText}>
              Puedes cambiar estas preferencias en cualquier momento desde configuración
            </Text>
          </View>
        </View>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonLoading
            ]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[COLORS.primary.sky, '#0EA5E9']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Text style={styles.continueButtonText}>Finalizando...</Text>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Comenzar NotFat</Text>
                  <Ionicons name="rocket" size={20} color={COLORS.text.primary} />
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
  preferenceCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  preferenceTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  unitButton: {
    paddingHorizontal: SPACING.lg,
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
  bottleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bottleCard: {
    width: '31%',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    position: 'relative',
  },
  bottleCardSelected: {
    backgroundColor: `${COLORS.primary.sky}20`,
    borderWidth: 2,
  },
  bottleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bottleSize: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  bottleSizeSelected: {
    color: COLORS.primary.sky,
  },
  bottleCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  switchText: {
    flex: 1,
  },
  switchTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  switchDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  summaryGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  summaryDescription: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    lineHeight: 22,
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
