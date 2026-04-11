import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useOnboardingStore } from '@/store/onboarding-store';
import { analytics } from '@/services/analytics';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

export default function OnboardingBirthDateScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const { setData: setOnboardingData } = useOnboardingStore();
  const [birthDate, setBirthDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const calculateAge = (date: Date) => {
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const adjustAge = (amount: number) => {
    const newDate = new Date(birthDate);
    newDate.setFullYear(newDate.getFullYear() - amount);
    
    const newAge = calculateAge(newDate);
    if (newAge >= 13 && newAge <= 120) {
      setBirthDate(newDate);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // En Android cerramos el picker tras la selección
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const selectedAge = calculateAge(selectedDate);
      
      // Validación: usuario debe tener al menos 13 años
      if (selectedAge < 13) {
        Alert.alert(
          'Edad Mínima',
          'Debes tener al menos 13 años para usar NotFat',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Validación: usuario no debe tener más de 120 años
      if (selectedAge > 120) {
        Alert.alert(
          'Fecha Inválida',
          'Por favor ingresa una fecha de nacimiento válida',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setBirthDate(selectedDate);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Sincronizado con Prisma: profiles.birth_date (DateTime)
        await updateProfile.mutateAsync({
          birth_date: birthDate.toISOString(), // DateTime format for Prisma
          onboarding_step: 'goals',
        });
      } else {
        // En store temporal
        setOnboardingData({ birth_date: birthDate.toISOString() });
      }

      analytics.trackOnboardingStep('birth_date', {
        age: calculateAge(birthDate),
      });

      navigation.navigate('OnboardingGoals' as never);
    } catch (error) {
      console.error('Error updating birth date:', error);
      Alert.alert('Error', 'No pudimos guardar tu fecha de nacimiento. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const userAge = calculateAge(birthDate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>¿Cuándo es tu cumpleaños?</Text>
            <Text style={styles.subtitle}>
              Esto nos ayuda a calcular tus necesidades calóricas y metas apropiadas
            </Text>
          </View>

          {/* Age Display - Now Modifiable */}
          <View style={styles.ageCard}>
            <View style={styles.ageIconContainer}>
              <Ionicons name="gift" size={32} color={colors.primary.sky} />
            </View>
            <View style={styles.ageContent}>
              <Text style={styles.ageLabel}>Tu edad estimada</Text>
              <View style={styles.ageAdjuster}>
                <TouchableOpacity onPress={() => adjustAge(-1)} style={styles.adjustBtn}>
                  <Ionicons name="remove-circle-outline" size={28} color={colors.primary.sky} />
                </TouchableOpacity>
                <Text style={styles.ageValue}>{userAge} años</Text>
                <TouchableOpacity onPress={() => adjustAge(1)} style={styles.adjustBtn}>
                  <Ionicons name="add-circle-outline" size={28} color={colors.primary.sky} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Date Picker Button */}
          <View style={styles.dateCardContainer}>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowPicker(true)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={styles.dateContent}>
                <View style={styles.dateIconContainer}>
                  <Ionicons name="calendar-outline" size={24} color={colors.primary.sky} />
                </View>
                <View style={styles.dateText}>
                  <Text style={styles.dateLabel}>Fecha seleccionada</Text>
                  <Text style={styles.dateValue}>{formatDate(birthDate)}</Text>
                </View>
                <Ionicons name="create-outline" size={24} color={colors.primary.sky} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Info Cards */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={20} color={colors.status.success} />
              <Text style={styles.infoText}>
                Tu información es segura y privada
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="calculator" size={20} color={colors.primary.amber} />
              <Text style={styles.infoText}>
                Usamos tu edad para calcular metas personalizadas
              </Text>
            </View>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={colors.text.muted} />
            <Text style={styles.privacyText}>
              Cumplimos con las normativas GDPR de protección de datos.
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
              colors={[colors.primary.sky, '#0EA5E9']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Text style={styles.continueButtonText}>Guardando...</Text>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continuar</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.text.primary} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal / View */}
      {showPicker && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerModal : null}>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity 
                onPress={() => setShowPicker(false)}
                style={styles.iosPickerDoneButton}
              >
                <Text style={styles.iosPickerDoneText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={birthDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={handleDateChange}
            textColor={Platform.OS === 'ios' ? '#FFFFFF' : undefined}
          />
        </View>
      )}
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
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.border,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    marginLeft: SPACING.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary.sky,
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
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    lineHeight: 24,
  },
  ageCard: {
    backgroundColor: colors.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.border,
    ...SHADOWS.sm,
  },
  ageIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.primary.sky}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  ageContent: {
    flex: 1,
  },
  ageLabel: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  ageValue: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  ageAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  adjustBtn: {
    padding: 4,
  },
  dateCardContainer: {
    marginBottom: SPACING.xl,
  },
  dateCard: {
    backgroundColor: colors.background.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.background.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  dateIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${colors.primary.sky}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dateText: {
    flex: 1,
  },
  dateLabel: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  dateValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  infoSection: {
    marginBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  privacyText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
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
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  iosPickerModal: {
    backgroundColor: colors.background.card,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.background.border,
    ...SHADOWS.lg,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.border,
  },
  iosPickerDoneButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  iosPickerDoneText: {
    color: colors.primary.sky,
    fontWeight: 'bold',
    fontSize: FONTS.sizes.base,
  },
});
