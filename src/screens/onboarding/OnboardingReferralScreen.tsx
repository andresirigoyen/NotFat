import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SPACING, FONTS, BORDER_RADIUS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Instagram, Search, Tv, Users, MessageCircle } from 'lucide-react-native';

const REFERRAL_OPTIONS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'tiktok', label: 'TikTok', icon: MessageCircle, color: '#000000' },
  { id: 'google', label: 'Búsqueda en Google', icon: Search, color: '#4285F4' },
  { id: 'friend', label: 'Recomendación de amigo', icon: Users, color: '#34A853' },
  { id: 'ads', label: 'Anuncio en TV / Youtube', icon: Tv, color: '#FF0000' },
  { id: 'other', label: 'Otro', icon: Share2, color: '#6B7280' },
];

export default function OnboardingReferralScreen() {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const { setData: setOnboardingData } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setOnboardingData({ traffic_source: selected });
    navigation.navigate('OnboardingName' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>¿Cómo nos conociste?</Text>
        <Text style={styles.subtitle}>Ayúdanos a saber dónde encontrar a más personas como tú.</Text>

        <View style={styles.grid}>
          {REFERRAL_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.card,
                  isSelected && { borderColor: option.color, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }
                ]}
                onPress={() => setSelected(option.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                  <Icon size={24} color={isSelected ? option.color : '#6B7280'} />
                </View>
                <Text style={[styles.label, isSelected && { color: option.color, fontWeight: 'bold' }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.button, !selected && styles.buttonDisabled]} 
          onPress={handleContinue}
          disabled={!selected}
        >
          <LinearGradient
            colors={selected ? ['#FBBF24', '#D97706'] : ['#333', '#333']}
            style={styles.gradient}
          >
            <Text style={[styles.buttonText, { color: selected ? '#000' : '#666' }]}>Continuar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING['3xl'],
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: SPACING['3xl'],
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  card: {
    width: '47%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#222',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  button: {
    marginTop: SPACING['3xl'],
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
