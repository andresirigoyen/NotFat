import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

const ALLERGIES = [
  { id: 'gluten', label: 'Gluten', icon: '🌾' },
  { id: 'lactose', label: 'Lactosa', icon: '🥛' },
  { id: 'peanuts', label: 'Maní', icon: '🥜' },
  { id: 'nuts', label: 'Frutos Secos', icon: '🌰' },
  { id: 'shellfish', label: 'Mariscos', icon: '🦐' },
  { id: 'soy', label: 'Soya', icon: '🫘' },
  { id: 'eggs', label: 'Huevos', icon: '🥚' },
];

export default function OnboardingAllergiesScreen() {
  const { isDark } = useThemeColors();
  const navigation = useNavigation();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    onboardingData.onboarding_metadata?.allergies || []
  );

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingAllergies' });
  }, [setOnboardingData]);

  const toggleAllergy = (id: string) => {
    setSelectedAllergies(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    setOnboardingData({
      onboarding_metadata: {
        ...(onboardingData.onboarding_metadata || {}),
        allergies: selectedAllergies
      }
    });
    navigation.navigate('OnboardingProfile' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.progressLabel}>SEGURIDAD ANTE TODO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(800)}>
          <Text style={styles.title}>¿Alguna alergia o intolerancia?</Text>
          <Text style={styles.subtitle}>
            Tu seguridad es nuestra prioridad. Nos aseguraremos de que tus planes de comidas sean 100% seguros para ti.
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {ALLERGIES.map((item, index) => {
            const isSelected = selectedAllergies.includes(item.id);
            return (
              <Animated.View key={item.id} entering={SlideInRight.delay(index * 50)}>
                <TouchableOpacity
                  style={[
                    styles.allergyCard,
                    isSelected && styles.allergyCardSelected
                  ]}
                  onPress={() => toggleAllergy(item.id)}
                >
                  <Text style={styles.allergyIcon}>{item.icon}</Text>
                  <Text style={[
                    styles.allergyLabel,
                    isSelected && styles.allergyLabelSelected
                  ]}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => {
            setSelectedAllergies([]);
            handleContinue();
          }}
        >
          <Text style={styles.skipText}>No tengo ninguna alergia</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleContinue}
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
    padding: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: 120,
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
    marginBottom: SPACING['2xl'],
  },
  grid: {
    gap: SPACING.sm,
  },
  allergyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#222',
  },
  allergyCardSelected: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  allergyIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  allergyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
    flex: 1,
  },
  allergyLabelSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  skipButton: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    padding: SPACING.md,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
  },
  button: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
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
