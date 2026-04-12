import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useProfile';
import { useOnboardingStore } from '@/store/onboarding-store';
import { analytics } from '@/services/analytics';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

export default function OnboardingBirthDateScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { updateProfile } = useProfile();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const firstName = onboardingData?.onboarding_metadata?.first_name || '';
  const [birthDate, setBirthDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingBirthDate' });
  }, [setOnboardingData]);

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
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      const selectedAge = calculateAge(selectedDate);
      
      if (selectedAge < 13) {
        Alert.alert(
          'Edad Mínima',
          'Debes tener al menos 13 años para usar NotFat',
          [{ text: 'OK' }]
        );
        return;
      }
      
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
        await updateProfile.mutateAsync({
          birth_date: birthDate.toISOString(),
          onboarding_step: 'goals',
        });
      } else {
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.progressWrapper}>
             <View style={styles.progressBackground}>
               <View style={[styles.progressBar, { width: '30%' }]} />
             </View>
             <Text style={styles.progressLabel}>PASO 3 DE 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {firstName ? `¡Excelente, ${firstName}!` : '¿Cuándo es tu cumpleaños?'}
            </Text>
            <Text style={styles.subtitle}>
              Tu edad es clave para calcular tus necesidades calóricas con precisión.
            </Text>
          </View>

          <View style={styles.ageCard}>
            <View style={styles.ageIconContainer}>
              <Ionicons name="gift" size={32} color="#FBBF24" />
            </View>
            <View style={styles.ageContent}>
              <Text style={styles.ageLabel}>Tu edad estimada</Text>
              <View style={styles.ageAdjuster}>
                <TouchableOpacity onPress={() => adjustAge(-1)} style={styles.adjustBtn}>
                  <Ionicons name="remove-circle-outline" size={28} color="#FBBF24" />
                </TouchableOpacity>
                <Text style={styles.ageValue}>{userAge} años</Text>
                <TouchableOpacity onPress={() => adjustAge(1)} style={styles.adjustBtn}>
                  <Ionicons name="add-circle-outline" size={28} color="#FBBF24" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.dateCardContainer}>
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => setShowPicker(true)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={styles.dateContent}>
                <View style={styles.dateIconContainer}>
                  <Ionicons name="calendar-outline" size={24} color="#FBBF24" />
                </View>
                <View style={styles.dateText}>
                  <Text style={styles.dateLabel}>Fecha seleccionada</Text>
                  <Text style={styles.dateValue}>{formatDate(birthDate)}</Text>
                </View>
                <Ionicons name="create-outline" size={24} color="#FBBF24" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark" size={20} color="#FBBF24" />
              <Text style={styles.infoText}>
                Tu información es segura y privada
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="calculator" size={20} color="#FBBF24" />
              <Text style={styles.infoText}>
                Usamos tu edad para calcular metas personalizadas
              </Text>
            </View>
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
                <Text style={styles.continueButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={22} color="#000" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  ageCard: {
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#222',
  },
  ageIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  ageContent: {
    flex: 1,
  },
  ageLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.primary,
    marginBottom: 4,
  },
  ageAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  adjustBtn: {
    padding: 4,
  },
  ageValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: FONTS.primary,
  },
  dateCardContainer: {
    marginBottom: SPACING.xl,
  },
  dateCard: {
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#222',
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dateText: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FONTS.primary,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: FONTS.primary,
  },
  infoSection: {
    marginBottom: SPACING.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#222',
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
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
  continueButtonDisabled: {
    opacity: 0.5,
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
  iosPickerModal: {
    backgroundColor: '#111',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    backgroundColor: '#1A1A1A',
  },
  iosPickerDoneButton: {
    padding: 8,
  },
  iosPickerDoneText: {
    color: '#FBBF24',
    fontSize: 16,
    fontWeight: '600',
  },
});
