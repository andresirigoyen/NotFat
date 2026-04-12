import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const REFERRAL_OPTIONS = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#FFF' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'friends_family', label: 'Friends and family', icon: 'people-outline', color: '#34A853' },
  { id: 'google_search', label: 'Google Search', icon: 'search-outline', color: '#4285F4' },
  { id: 'app_store', label: 'App Store', icon: 'logo-apple', color: '#FFF' },
  { id: 'ai_chat', label: 'AI Chat (e.g. ChatGPT)', icon: 'sparkles-outline', color: '#10A37F' },
  { id: 'influencer', label: 'Influencer', icon: 'star-outline', color: '#FBBF24' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

export default function OnboardingReferralScreen() {
  const { isDark } = useThemeColors();
  const navigation = useNavigation();
  const { data: onboardingData, setData: setOnboardingData } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(onboardingData.traffic_source || null);

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingReferral' });
  }, [setOnboardingData]);

  const handleContinue = () => {
    if (!selected) return;
    setOnboardingData({ traffic_source: selected });
    navigation.navigate('OnboardingGender' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressWrapper}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: '10%' }]} />
          </View>
          <Text style={styles.progressLabel}>CUESTIONARIO</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How did you hear about NotFat?</Text>
        <Text style={styles.subtitle}>Help us spread the word to more people like you.</Text>

        <View style={styles.list}>
          {REFERRAL_OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected
                ]}
                onPress={() => setSelected(option.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconWrapper,
                  { backgroundColor: isSelected ? option.color : 'rgba(255,255,255,0.05)' }
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={22} 
                    color={isSelected ? (option.color === '#FFF' ? '#000' : '#FFF') : '#6B7280'} 
                  />
                </View>
                <Text style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkWrapper}>
                    <Ionicons name="checkmark-circle" size={20} color="#FBBF24" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, !selected && styles.buttonDisabled]} 
          onPress={handleContinue}
          disabled={!selected}
        >
          <LinearGradient
            colors={selected ? ['#FBBF24', '#D97706'] : ['#333', '#333']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.buttonText, { color: selected ? '#000' : '#666' }]}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color={selected ? '#000' : '#666'} />
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    height: 60,
    justifyContent: 'center',
  },
  progressWrapper: {
    width: '100%',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING['3xl'],
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
  list: {
    gap: SPACING.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#222',
  },
  optionCardSelected: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
    flex: 1,
  },
  optionLabelSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  checkWrapper: {
    marginLeft: SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: '#000',
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
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONTS.primary,
  },
});

