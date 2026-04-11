import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useAuthStore } from '@/store';
import { supabase } from '@/services/SupabaseContext';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { analytics } from '@/services/analytics';

export default function OnboardingModeSelectionScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [selectedMode, setSelectedMode] = useState<'hard' | 'soft' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeSelection = async (mode: 'hard' | 'soft') => {
    if (!user) return;
    setSelectedMode(mode);
    setIsLoading(true);

    try {
      // Actualizamos el modo en la base de datos
      const { error } = await supabase
        .from('profiles')
        .update({ coach_mode: mode })
        .eq('id', user.id);

      if (error) throw error;

      analytics.trackOnboardingStep('coach_mode_selected', { mode });

      // Mostramos el mensaje de feedback
      if (mode === 'hard') {
        Alert.alert(
          'ADVERTENCIA: Tono Agresivo Activado',
          'Has elegido el Fuego Real. Prepárate para la verdad sin filtros.',
          [
            { 
              text: 'Aceptar', 
              onPress: () => navigation.dispatch(StackActions.replace('Main' as never)) 
            }
          ]
        );
      } else {
        Alert.alert(
          'Bienvenido al equipo',
          'El Modo Aliado está listo. Estaremos contigo en cada registro.',
          [
            { 
              text: 'Comenzar', 
              onPress: () => navigation.dispatch(StackActions.replace('Main' as never)) 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error saving coach mode:', error);
      Alert.alert('Error', 'No pudimos guardar tu preferencia. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>Selecciona tu Modo</Text>
          <Text style={styles.subtitle}>¿Cómo quieres que la IA interactúe contigo?</Text>
        </Animated.View>

        <View style={styles.grid}>
          {/* Tarjeta A: Fuego Real (Hard) */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Pressable
              onPress={() => handleModeSelection('hard')}
              style={({ pressed }) => [
                styles.card,
                styles.hardCard,
                selectedMode === 'hard' && styles.hardCardSelected,
                pressed && { opacity: 0.8 }
              ]}
              disabled={isLoading}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF006620' }]}>
                  <Ionicons name="flame" size={32} color="#FF0066" />
                </View>
                <Text style={styles.cardTitle}>Fuego Real</Text>
              </View>
              <Text style={styles.cardDescription}>
                La IA será tu espejo: sin excusas, sin filtros, puro reto disruptivo.
              </Text>
              <Ionicons 
                name="warning-outline" 
                size={24} 
                color="#38BDF8" 
                style={styles.cornerIcon} 
              />
            </Pressable>
          </Animated.View>

          {/* Tarjeta B: Modo Aliado (Soft) */}
          <Animated.View entering={FadeInDown.delay(500)}>
            <Pressable
              onPress={() => handleModeSelection('soft')}
              style={({ pressed }) => [
                styles.card,
                styles.softCard,
                selectedMode === 'soft' && styles.softCardSelected,
                pressed && { opacity: 0.8 }
              ]}
              disabled={isLoading}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="heart" size={32} color="#10B981" />
                </View>
                <Text style={styles.cardTitle}>Modo Aliado</Text>
              </View>
              <Text style={styles.cardDescription}>
                La IA será tu libreta y tu apoyo: registro silencioso, mensajes motivadores y progreso guiado.
              </Text>
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
          <Text style={styles.footerNote}>Puedes cambiar esto más tarde en configuración.</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING['2xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: FONTS.sizes['4xl'],
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    fontFamily: FONTS.primary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: FONTS.primary,
  },
  grid: {
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },
  cardDescription: {
    fontSize: FONTS.sizes.base,
    color: '#D1D5DB',
    lineHeight: 24,
    fontFamily: FONTS.primary,
  },
  hardCard: {
    borderColor: '#FF006630', // Borde neón suave por defecto
  },
  hardCardSelected: {
    borderColor: '#FF0066',
    borderWidth: 3,
    shadowColor: '#FF0066',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  softCard: {
    borderColor: '#10B98130',
  },
  softCardSelected: {
    borderColor: '#10B981',
    borderWidth: 3,
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  cornerIcon: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },
  footer: {
    marginTop: SPACING['2xl'],
    alignItems: 'center',
  },
  footerNote: {
    color: '#4B5563',
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
  },
});
