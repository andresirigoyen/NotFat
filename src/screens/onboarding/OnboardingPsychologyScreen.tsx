import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingPsychologyScreen() {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();

  const [hungerTrigger, setHungerTrigger] = useState('');
  const [weekendStruggle, setWeekendStruggle] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  const HUNGER_OPTIONS = [
    { label: 'Estrés 😫', value: 'Estrés' },
    { label: 'Aburrimiento 🥱', value: 'Aburrimiento' },
    { label: 'Ansiedad 😰', value: 'Ansiedad' },
    { label: 'Cansancio 😴', value: 'Cansancio' },
    { label: 'Social 🍻', value: 'Social' },
  ];

  const WEEKEND_OPTIONS = [
    { label: 'Salidas 🌯', value: 'Salidas/Restaurantes' },
    { label: 'Alcohol 🍷', value: 'Alcohol' },
    { label: 'Familia 👨‍👩‍👧', value: 'Eventos Familiares' },
    { label: 'Sin Horarios ⏰', value: 'Falta de Rutina' },
    { label: 'Cine/Snacks 🍿', value: 'Snacking Inconsciente' },
  ];

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingPsychology' });
  }, [setOnboardingData]);

  const handleContinue = () => {
    if (!targetWeight || !hungerTrigger || !weekendStruggle) {
      Alert.alert('Espera', 'Por favor completa todos los campos para personalizar tu plan.');
      return;
    }

    setOnboardingData({
      onboarding_metadata: {
        ...(onboardingData.onboarding_metadata || {}),
        hunger_trigger: hungerTrigger,
        weekend_struggle: weekendStruggle,
      },
      target_weight_kg: parseFloat(targetWeight),
    });

    navigation.navigate('OnboardingModeSelection' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                 <View style={[styles.progressBar, { width: '85%' }]} />
               </View>
               <Text style={styles.progressLabel}>PASO 9 DE 10</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Casi listos...</Text>
              <Text style={styles.subtitle}>
                Tu enfoque mental es el motor de tu éxito. Dinos hacia dónde vamos.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso Meta Máximo (kg)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#FBBF24" />
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 70"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Qué dispara tu hambre?</Text>
              <View style={styles.chipsRow}>
                {HUNGER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, hungerTrigger === opt.value && styles.chipActive]}
                    onPress={() => setHungerTrigger(opt.value)}
                  >
                    <Text style={[styles.chipText, hungerTrigger === opt.value && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="flash-outline" size={20} color="#FBBF24" />
                <TextInput
                  style={styles.input}
                  placeholder="U otro: Estrés, aburrimiento..."
                  placeholderTextColor="#4B5563"
                  value={hungerTrigger}
                  onChangeText={setHungerTrigger}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reto de Fin de Semana</Text>
              <View style={styles.chipsRow}>
                {WEEKEND_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, weekendStruggle === opt.value && styles.chipActive]}
                    onPress={() => setWeekendStruggle(opt.value)}
                  >
                    <Text style={[styles.chipText, weekendStruggle === opt.value && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#FBBF24" />
                <TextInput
                  style={styles.input}
                  placeholder="U otro: Cenas fuera, alcohol..."
                  placeholderTextColor="#4B5563"
                  value={weekendStruggle}
                  onChangeText={setWeekendStruggle}
                />
              </View>
            </View>

            <View style={styles.privacyCard}>
              <Ionicons name="eye-off-outline" size={16} color="#FBBF24" />
              <Text style={styles.privacyText}>
                Esta información ayuda a la IA a predecir posibles barreras.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[
                styles.button,
                (!targetWeight || !hungerTrigger || !weekendStruggle) && styles.buttonDisabled
              ]} 
              onPress={handleContinue}
              disabled={!targetWeight || !hungerTrigger || !weekendStruggle}
            >
              <LinearGradient
                colors={['#FBBF24', '#D97706']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  // Implementación directa para mayor velocidad y consistencia
});

const styles = StyleSheet.create({
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
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#FBBF24',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FBBF24',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: '#222',
    height: 64,
  },
  input: {
    flex: 1,
    height: 64,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    fontFamily: FONTS.primary,
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
    paddingTop: SPACING.xl,
  },
  button: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
});
