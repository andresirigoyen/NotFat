import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingNameScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const [name, setName] = useState(onboardingData.full_name || '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingName' });
  }, [setOnboardingData]);

  const handleContinue = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Espera', 'Por favor dinos tu nombre para personalizar tu experiencia.');
      return;
    }
    
    const firstName = trimmedName.split(' ')[0];
    setOnboardingData({ 
        full_name: trimmedName,
        onboarding_metadata: { 
          ...(onboardingData.onboarding_metadata || {}),
          first_name: firstName 
        } 
    });
    
    navigation.navigate('OnboardingGender' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
               <View style={[styles.progressBar, { width: '10%' }]} />
             </View>
             <Text style={styles.progressLabel}>PASO 1 DE 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>¿Cómo te llamas?</Text>
          <Text style={styles.subtitle}>Nos gusta hablarle a las personas por su nombre.</Text>

          <View style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused
          ]}>
            <Ionicons name="person-outline" size={24} color={isFocused ? '#FBBF24' : '#6B7280'} />
            <TextInput
              style={styles.input}
              placeholder="Escribe tu nombre..."
              placeholderTextColor="#4B5563"
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          <View style={styles.spacer} />

          <TouchableOpacity 
            style={[
              styles.button,
              !name.trim() && styles.buttonDisabled
            ]} 
            onPress={handleContinue}
            disabled={!name.trim()}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: FONTS.primary,
    lineHeight: 24,
    marginBottom: SPACING['3xl'],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    borderWidth: 1,
    borderColor: '#222',
    height: 64,
  },
  inputWrapperFocused: {
    borderColor: '#FBBF24',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#FFF',
    marginLeft: SPACING.md,
    fontFamily: FONTS.primary,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginBottom: SPACING.md,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontFamily: FONTS.primary,
  },
});
