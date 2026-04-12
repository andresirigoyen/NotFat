import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { supabase } from '@/services/SupabaseContext';
import { useOnboardingStore } from '@/store/onboarding-store';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { analytics } from '@/services/analytics';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingModeSelectionScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const { user, refreshProfile } = useAuthStore();
  const { setData: setOnboardingData } = useOnboardingStore();
  const [selectedMode, setSelectedMode] = useState<'hard' | 'friendly' | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setOnboardingData({ last_visited_step: 'OnboardingModeSelection' });
  }, [setOnboardingData]);

  const handleConfirm = async () => {
    if (!selectedMode) return;

    setLoading(true);
    try {
      const isHard = selectedMode === 'hard';
      const coachStyle = isHard ? 'reto' : 'apoyo';

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            coach_mode: selectedMode,
            coach_style: coachStyle,
          })
          .eq('id', user.id);

        if (error) throw new Error(error.message);
        analytics.trackOnboardingStep('coach_mode_selected', { mode: selectedMode });
        navigation.navigate('OnboardingGeneratingPlan' as never);
      } else {
        setOnboardingData({ 
          coach_style: coachStyle
        });
        analytics.trackOnboardingStep('coach_mode_selected_anonymous', { mode: selectedMode });
        navigation.navigate('OnboardingNotification' as never);
      }
    } catch (e: any) {
      console.error('Selection confirm error:', e);
      Alert.alert('Error', `No pudimos guardar tu configuración: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
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
               <View style={[styles.progressBar, { width: '90%' }]} />
             </View>
             <Text style={styles.progressLabel}>PASO 10 DE 10</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Selecciona tu Modo</Text>
            <Text style={styles.subtitle}>Esto define la personalidad y el tono de tu Coach IA.</Text>
          </View>

          <View style={styles.grid}>
            <Pressable
              onPress={() => setSelectedMode('hard')}
              style={[
                styles.card,
                selectedMode === 'hard' && styles.cardSelectedHard,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <Ionicons name="flame" size={28} color="#EF4444" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Fuego Real</Text>
                  <View style={styles.badgeHard}><Text style={styles.badgeText}>RETO</Text></View>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                Tu Coach será implacable. Sin filtros ni excusas. Prepárate para la disciplina cruda necesaria para resultados extremos.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedMode('friendly')}
              style={[
                styles.card,
                selectedMode === 'friendly' && styles.cardSelectedFriendly,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                  <Ionicons name="heart" size={28} color="#FBBF24" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Modo Aliado</Text>
                  <View style={styles.badgeFriendly}><Text style={styles.badgeText}>APOYO</Text></View>
                </View>
              </View>
              <Text style={styles.cardDescription}>
                Un acompañamiento empático y motivador. Metas progresivas con un enfoque en la sostenibilidad y el bienestar.
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              !selectedMode && styles.buttonDisabled
            ]}
            onPress={handleConfirm}
            disabled={!selectedMode || loading}
          >
            <LinearGradient
              colors={['#FBBF24', '#D97706']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.buttonLayout}>
                  <Text style={styles.continueButtonText}>Activar Coach</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                </View>
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
    backgroundColor: '#000',
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
  grid: {
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardSelectedHard: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cardSelectedFriendly: {
    borderColor: '#FBBF24',
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  badgeHard: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeFriendly: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
  },
  cardDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING['2xl'],
  },
  continueButton: {
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
  buttonLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
});
