import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { supabase } from '@/services/SupabaseContext';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS, SCREEN } from '@/constants/theme';
import { analytics } from '@/services/analytics';

export default function OnboardingModeSelectionScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const { user, refreshProfile } = useAuthStore();
  const [selectedMode, setSelectedMode] = useState<'hard' | 'soft' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedMode) return;
    if (!user) {
      Alert.alert('Error', 'No se encontró la sesión del usuario.');
      return;
    }

    setLoading(true);
    try {
      // Intentamos actualizar el perfil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          coach_mode: selectedMode,
          coach_style: selectedMode === 'hard' ? 'reto' : 'apoyo',
          onboarding_completed: true,
          onboarding_step: 'completed'
        })
        .eq('id', user.id);

      if (error) {
        console.error('Database update error:', error);
        throw new Error(error.message);
      }

      // Actualizar estado global del store
      if (refreshProfile) {
        await refreshProfile();
      }

      analytics.trackOnboardingStep('coach_mode_selected', { mode: selectedMode });

      // Éxito: Navegar al Main Navigator
      navigation.dispatch(StackActions.replace('Main'));
      
    } catch (e: any) {
      console.error('Selection confirm error:', e);
      Alert.alert(
        'Error de Conexión', 
        `No pudimos guardar tu configuración. Asegúrate de tener conexión a internet. (${e.message})`
      );
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
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <Text style={styles.title}>Selecciona tu Modo</Text>
            <Text style={styles.subtitle}>Esto define la personalidad de tu Coach IA</Text>
          </Animated.View>

          <View style={styles.grid}>
            {/* Tarjeta A: Fuego Real (Hard) */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Pressable
                onPress={() => setSelectedMode('hard')}
                disabled={loading}
                style={[
                  styles.card,
                  styles.hardCard,
                  selectedMode === 'hard' && styles.hardCardSelected,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FF006620' }]}>
                    <Ionicons name="flame" size={32} color="#FF0066" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Fuego Real</Text>
                    <Text style={styles.cardBadge}>HARD</Text>
                  </View>
                </View>
                <Text style={styles.cardDescription}>
                  La IA será tu espejo: sin excusas ni filtros. No esperes amabilidad; prepárate para la verdad cruda y una disciplina implacable para alcanzar tus metas.
                </Text>
              </Pressable>
            </Animated.View>

            {/* Tarjeta B: Modo Aliado (Soft) */}
            <Animated.View entering={FadeInDown.delay(500)}>
              <Pressable
                onPress={() => setSelectedMode('soft')}
                disabled={loading}
                style={[
                  styles.card,
                  styles.softCard,
                  selectedMode === 'soft' && styles.softCardSelected,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="heart" size={32} color="#10B981" />
                  </View>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>Modo Aliado</Text>
                    <Text style={[styles.cardBadge, { backgroundColor: '#10B981', color: '#FFF' }]}>SOFT</Text>
                  </View>
                </View>
                <Text style={styles.cardDescription}>
                  La IA será tu apoyo: mensajes motivadores y progreso guiado con empatía.
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          <Animated.View entering={FadeIn.delay(700)} style={styles.footer}>
            <TouchableOpacity 
              style={[
                styles.continueBtn, 
                !selectedMode && styles.continueBtnDisabled,
                loading && { opacity: 0.8 }
              ]}
              onPress={handleConfirm}
              disabled={!selectedMode || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.continueBtnText}>
                  {selectedMode ? 'Comenzar ahora' : 'Selecciona un modo'}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.footerNote}>Puedes cambiar esto luego en tu perfil.</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  content: {
    paddingHorizontal: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: FONTS.primary,
    lineHeight: 22,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    ...SHADOWS.md,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#FF0066',
    color: '#FFFFFF',
    overflow: 'hidden',
  },
  cardDescription: {
    fontSize: FONTS.sizes.sm,
    color: '#D1D5DB',
    lineHeight: 20,
    fontFamily: FONTS.primary,
  },
  loader: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  hardCard: {
    borderColor: 'rgba(255, 0, 102, 0.1)',
  },
  hardCardSelected: {
    borderColor: '#FF0066',
    backgroundColor: 'rgba(255, 0, 102, 0.05)',
  },
  softCard: {
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  softCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  footerNote: {
    color: '#6B7280',
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: SPACING.md,
  },
  continueBtn: {
    backgroundColor: '#38BDF8', // sky-400
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  continueBtnDisabled: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  continueBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONTS.primary,
    letterSpacing: -0.5,
  },
});
