import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useCreateNotificationPreference } from '@/hooks/useNotifications';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { analytics } from '@/services/analytics';
import { useOnboardingStore } from '@/store/onboarding-store';

const WATER_UNITS = [
  { id: 'ml', label: 'ml' },
  { id: 'oz', label: 'oz' },
];

const BOTTLE_SIZES = {
  ml: [250, 500, 750, 1000, 1500],
  oz: [8, 16, 24, 32, 50],
};

export default function OnboardingPreferencesScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const { mutateAsync: createNotificationPreference } = useCreateNotificationPreference();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  
  const [preferredBottleUnit, setPreferredBottleUnit] = useState<'ml' | 'oz'>(onboardingData.preferred_bottle_unit || 'ml');
  const [preferredBottleSize, setPreferredBottleSize] = useState<number>(onboardingData.preferred_bottle_size || 1000);
  const [showCalories, setShowCalories] = useState<boolean>(onboardingData.show_calories ?? true);
  const [showHydration, setShowHydration] = useState<boolean>(onboardingData.show_hydration ?? true);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingPreferences' });
  }, [setOnboardingData]);

  const availableBottleSizes = BOTTLE_SIZES[preferredBottleUnit];

  const createDefaultNotificationPreferences = async () => {
    if (!user) return;
    const defaultPrefs = [
      { hour: 8, minute: 0, meal_type: 'breakfast', enabled: true, is_custom: false, label: 'Desayuno', predefined_type: 'meal_reminder' },
      { hour: 13, minute: 0, meal_type: 'lunch', enabled: true, is_custom: false, label: 'Almuerzo', predefined_type: 'meal_reminder' },
      { hour: 20, minute: 0, meal_type: 'dinner', enabled: true, is_custom: false, label: 'Cena', predefined_type: 'meal_reminder' },
    ];
    for (const pref of defaultPrefs) {
      await createNotificationPreference(pref as any);
    }
  };

  const handleContinue = async () => {
      setIsLoading(true);
      try {
        if (user) {
          await updateProfile.mutateAsync({
            preferred_bottle_size: preferredBottleSize,
            preferred_bottle_unit: preferredBottleUnit,
            show_calories: showCalories,
            show_hydration: showHydration,
            onboarding_step: 'psychology',
          } as any);
          await createDefaultNotificationPreferences();
        } else {
          setOnboardingData({
            preferred_bottle_size: preferredBottleSize,
            preferred_bottle_unit: preferredBottleUnit,
            show_calories: showCalories,
            show_hydration: showHydration,
          });
        }
        analytics.trackOnboardingStep('preferences', { preferred_bottle_size: preferredBottleSize });
        navigation.navigate('OnboardingPsychology' as never);
      } catch (error) {
        console.error('Error updating preferences:', error);
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.progressWrapper}>
             <View style={styles.progressBackground}>
               <View style={[styles.progressBar, { width: '80%' }]} />
             </View>
             <Text style={styles.progressLabel}>PASO 8 DE 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Preferencias Finales</Text>
            <Text style={styles.subtitle}>
              Personaliza tu experiencia para que se adapte perfectamente a tu estilo de vida.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hidratación</Text>
            <View style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <Ionicons name="water-outline" size={20} color="#FBBF24" />
                <Text style={styles.preferenceTitleText}>Unidad de medida</Text>
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
                <Ionicons name="pint-outline" size={20} color="#FBBF24" />
                <Text style={styles.preferenceTitleText}>Tamaño de botella ideal</Text>
              </View>
              <View style={styles.bottleGrid}>
                {availableBottleSizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.bottleCard,
                      preferredBottleSize === size && styles.bottleCardSelected,
                    ]}
                    onPress={() => setPreferredBottleSize(size)}
                  >
                    <Text style={[
                      styles.bottleSizeText,
                      preferredBottleSize === size && styles.bottleSizeTextSelected
                    ]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visualización</Text>
            <View style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextContent}>
                  <Text style={styles.toggleLabel}>Mostrar Calorías</Text>
                  <Text style={styles.toggleSublabel}>Ver aporte energético en el dashboard</Text>
                </View>
                <Switch
                  value={showCalories}
                  onValueChange={setShowCalories}
                  trackColor={{ false: '#333', true: '#FBBF24' }}
                  thumbColor={showCalories ? '#000' : '#6B7280'}
                />
              </View>

              <View style={[styles.toggleRow, { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: '#222' }]}>
                <View style={styles.toggleTextContent}>
                  <Text style={styles.toggleLabel}>Mostrar Hidratación</Text>
                  <Text style={styles.toggleSublabel}>Seguimiento detallado de agua</Text>
                </View>
                <Switch
                  value={showHydration}
                  onValueChange={setShowHydration}
                  trackColor={{ false: '#333', true: '#FBBF24' }}
                  thumbColor={showHydration ? '#000' : '#6B7280'}
                />
              </View>
            </View>
          </View>

          <View style={styles.privacyCard}>
            <Ionicons name="shield-checkmark" size={16} color="#FBBF24" />
            <Text style={styles.privacyText}>
              Estas preferencias son privadas y se sincronizan en todos tus dispositivos.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isLoading && styles.continueButtonLoading
            ]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.buttonLayout}>
                <Text style={styles.continueButtonText}>Finalizar Configuración</Text>
                <Ionicons name="arrow-forward" size={22} color="#000" />
              </View>
            )}
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  preferenceCard: {
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#222',
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  preferenceTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
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
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
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
  bottleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  bottleCard: {
    flex: 1,
    minWidth: '18%',
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  bottleCardSelected: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  bottleSizeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  bottleSizeTextSelected: {
    color: '#FBBF24',
  },
  toggleCard: {
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#222',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  toggleSublabel: {
    fontSize: 12,
    color: '#6B7280',
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
    height: 64,
    backgroundColor: '#FBBF24',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  continueButtonLoading: {
    opacity: 0.8,
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
