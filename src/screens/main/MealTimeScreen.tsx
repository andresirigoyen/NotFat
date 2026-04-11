import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Clock, CalendarDays, ChevronRight, ArrowLeft, Zap } from 'lucide-react-native';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const { width } = Dimensions.get('window');

const MEAL_OPTIONS = [
  {
    id: 'breakfast',
    name: 'Desayuno',
    timeRange: '7:00 – 10:00',
    description: 'Primera comida del día',
    icon: '🌅',
    accent: '#FBBF24',
    gradient: ['rgba(251,191,36,0.18)', 'rgba(251,191,36,0.04)'] as [string, string],
  },
  {
    id: 'snack_morning',
    name: 'Snack Mañana',
    timeRange: '10:00 – 11:00',
    description: 'Energía entre horas',
    icon: '🥐',
    accent: '#A78BFA',
    gradient: ['rgba(167,139,250,0.18)', 'rgba(167,139,250,0.04)'] as [string, string],
  },
  {
    id: 'lunch',
    name: 'Almuerzo',
    timeRange: '12:00 – 14:00',
    description: 'La comida principal',
    icon: '🍽️',
    accent: '#34D399',
    gradient: ['rgba(52,211,153,0.18)', 'rgba(52,211,153,0.04)'] as [string, string],
  },
  {
    id: 'snack_afternoon',
    name: 'Snack Tarde',
    timeRange: '16:00 – 17:00',
    description: 'Recarga de energía',
    icon: '🍎',
    accent: '#FB923C',
    gradient: ['rgba(251,146,60,0.18)', 'rgba(251,146,60,0.04)'] as [string, string],
  },
  {
    id: 'dinner',
    name: 'Cena',
    timeRange: '19:00 – 21:00',
    description: 'Última comida del día',
    icon: '🌙',
    accent: '#60A5FA',
    gradient: ['rgba(96,165,250,0.18)', 'rgba(96,165,250,0.04)'] as [string, string],
  },
  {
    id: 'snack_night',
    name: 'Snack Noche',
    timeRange: '21:00 – 22:00',
    description: 'Algo ligero antes de dormir',
    icon: '🍵',
    accent: '#F472B6',
    gradient: ['rgba(244,114,182,0.18)', 'rgba(244,114,182,0.04)'] as [string, string],
  },
];

const MealTimeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useThemeColors();
  const [selected, setSelected] = useState<string | null>(null);
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => {
      navigation.navigate('MealLogger', { mealType: id });
    }, 150);
  };

  const handleCustomTime = () => navigation.navigate('CustomTimeMeal');

  const handleYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    navigation.navigate('MealLogger', { mealDate: yesterday.toISOString(), mealType: 'custom' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={isDark ? '#fff' : '#111'} />
        </TouchableOpacity>
        <View style={styles.headerBadge}>
          <Clock size={13} color="#FBBF24" />
          <Text style={styles.headerBadgeText}>Registro de Comida</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>¿Cuándo comiste?</Text>
          <Text style={styles.subtitle}>Selecciona el momento más cercano a tu comida</Text>
        </View>

        {/* Meal time cards */}
        <View style={styles.grid}>
          {MEAL_OPTIONS.map((meal) => {
            const isSelected = selected === meal.id;
            return (
              <TouchableOpacity
                key={meal.id}
                activeOpacity={0.85}
                style={[styles.card, isSelected && { borderColor: meal.accent, borderWidth: 1.5 }]}
                onPress={() => handleSelect(meal.id)}
              >
                <LinearGradient
                  colors={meal.gradient}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Icon */}
                  <View style={[styles.iconBox, { backgroundColor: `${meal.accent}20` }]}>
                    <Text style={styles.iconEmoji}>{meal.icon}</Text>
                  </View>

                  <Text style={styles.cardName}>{meal.name}</Text>
                  <Text style={[styles.cardTime, { color: meal.accent }]}>{meal.timeRange}</Text>
                  <Text style={styles.cardDesc}>{meal.description}</Text>

                  {/* Chevron */}
                  <View style={styles.cardChevron}>
                    <ChevronRight size={14} color={meal.accent} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>Otras opciones</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Custom time */}
        <TouchableOpacity style={styles.altCard} onPress={handleCustomTime} activeOpacity={0.85}>
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.altIcon, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
            <Clock size={18} color="#FBBF24" />
          </View>
          <View style={styles.altInfo}>
            <Text style={styles.altTitle}>Hora personalizada</Text>
            <Text style={styles.altDesc}>Elige exactamente cuándo fue</Text>
          </View>
          <ChevronRight size={18} color="#FBBF24" />
        </TouchableOpacity>

        {/* Yesterday */}
        <TouchableOpacity style={styles.altCard} onPress={handleYesterday} activeOpacity={0.85}>
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.altIcon, { backgroundColor: 'rgba(96,165,250,0.12)' }]}>
            <CalendarDays size={18} color="#60A5FA" />
          </View>
          <View style={styles.altInfo}>
            <Text style={styles.altTitle}>Registrar de ayer</Text>
            <Text style={styles.altDesc}>Log de comida del día anterior</Text>
          </View>
          <ChevronRight size={18} color="#60A5FA" />
        </TouchableOpacity>

        {/* Quick tip */}
        <View style={styles.tipCard}>
          <Zap size={14} color="#FBBF24" fill="#FBBF24" />
          <Text style={styles.tipText}>
            Registrar al momento es más preciso. Tu cuerpo lo agradece.
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#F9FAFB',
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.12)',
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.25)',
    },
    headerBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#FBBF24',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    scroll: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.md,
    },
    titleSection: {
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: 32,
      fontWeight: '900',
      color: isDark ? '#FFFFFF' : '#111827',
      letterSpacing: -0.8,
      marginBottom: 6,
      fontFamily: FONTS.primary,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? 'rgba(255,255,255,0.45)' : '#6B7280',
      fontWeight: '500',
      fontFamily: FONTS.primary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: SPACING.lg,
    },
    card: {
      width: (width - SPACING.md * 2 - 10) / 2,
      borderRadius: BORDER_RADIUS['2xl'],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    cardGradient: {
      padding: 18,
      paddingBottom: 14,
      position: 'relative',
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    iconEmoji: {
      fontSize: 22,
    },
    cardName: {
      fontSize: 15,
      fontWeight: '900',
      color: isDark ? '#FFF' : '#111827',
      marginBottom: 3,
      fontFamily: FONTS.primary,
    },
    cardTime: {
      fontSize: 11,
      fontWeight: '800',
      marginBottom: 4,
      letterSpacing: 0.2,
      fontFamily: FONTS.primary,
    },
    cardDesc: {
      fontSize: 11,
      color: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
      fontWeight: '500',
      fontFamily: FONTS.primary,
    },
    cardChevron: {
      position: 'absolute',
      top: 14,
      right: 14,
      opacity: 0.7,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    dividerLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    altCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BORDER_RADIUS.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
      padding: 16,
      marginBottom: 10,
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
      gap: 14,
    },
    altIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    altInfo: {
      flex: 1,
    },
    altTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: isDark ? '#FFF' : '#111827',
      marginBottom: 2,
      fontFamily: FONTS.primary,
    },
    altDesc: {
      fontSize: 12,
      color: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
      fontWeight: '500',
      fontFamily: FONTS.primary,
    },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(251,191,36,0.08)',
      borderRadius: BORDER_RADIUS.lg,
      padding: 14,
      marginTop: SPACING.sm,
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.15)',
    },
    tipText: {
      flex: 1,
      fontSize: 12,
      color: isDark ? 'rgba(255,255,255,0.55)' : '#6B7280',
      fontWeight: '600',
      lineHeight: 18,
      fontFamily: FONTS.primary,
    },
  });

export default MealTimeScreen;
