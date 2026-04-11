import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
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
  const { user } = useAuthStore();
  const [selectedMode, setSelectedMode] = useState<'hard' | 'soft' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeSelection = async (mode: 'hard' | 'soft') => {
    if (!user) {
      Alert.alert('Error', 'Usuario no identificado. Por favor ingresa de nuevo.');
      return;
    }
    
    setSelectedMode(mode);
    setIsLoading(true);

    try {
      // Actualizamos el modo en la base de datos
      const { error } = await supabase
        .from('profiles')
        .update({ 
          coach_mode: mode,
          coach_style: mode === 'hard' ? 'reto' : 'apoyo',
          onboarding_step: 'completed' 
        })
        .eq('id', user.id);

      if (error) throw error;

      analytics.trackOnboardingStep('coach_mode_selected', { mode });

      // Mensaje de feedback y navegación
      const alertTitle = mode === 'hard' ? 'ADVERTENCIA: Tono Agresivo' : 'Bienvenido al equipo';
      const alertMsg = mode === 'hard' 
        ? 'Has elegido el Fuego Real. Prepárate para la verdad sin filtros.' 
        : 'El Modo Aliado está listo. Estaremos contigo en cada paso.';

      Alert.alert(
        alertTitle,
        alertMsg,
        [
          { 
            text: mode === 'hard' ? 'Aceptar' : 'Comenzar', 
            onPress: () => {
              // Navegar al Main Navigator
              navigation.dispatch(StackActions.replace('Main'));
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('Error saving coach mode:', error);
      Alert.alert('Error', `No pudimos guardar tu preferencia: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
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
                  (pressed || isLoading) && { opacity: 0.7 }
                ]}
                disabled={isLoading}
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
                  La IA será tu espejo: sin excusas, sin filtros, puro reto disruptivo para que alcances tus metas cueste lo que cueste.
                </Text>
                {isLoading && selectedMode === 'hard' && (
                  <ActivityIndicator size="small" color="#FF0066" style={styles.loader} />
                )}
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
                  (pressed || isLoading) && { opacity: 0.7 }
                ]}
                disabled={isLoading}
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
                  La IA será tu apoyo: registro silencioso, mensajes motivadores y progreso guiado paso a paso con empatía.
                </Text>
                {isLoading && selectedMode === 'soft' && (
                  <ActivityIndicator size="small" color="#10B981" style={styles.loader} />
                )}
              </Pressable>
            </Animated.View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerNote}>Puedes cambiar esta configuración en cualquier momento desde tu perfil.</Text>
          </View>
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
  },
  footerNote: {
    color: '#6B7280',
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
