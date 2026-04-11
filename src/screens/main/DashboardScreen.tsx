import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Vibration,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform as RNPlatform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { MainStackParamList } from '@/types/navigation';
import { FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import HydrationModal from '@/components/HydrationModal';
import HealthScoreCard from '@/components/HealthScoreCard';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useCoachMessage } from '@/hooks/useCoachMessage';
import { useProfile } from '@/hooks/useProfile';
import { useWaterLogs, useAddWater } from '@/hooks/useWaterLogs';
import { useBodyMetrics, useAddBodyMetric } from '@/hooks/useBodyMetrics';
import { useMealsByDate } from '@/hooks/useMeals';
import { useAuthStore } from '@/store';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useQueryClient } from '@tanstack/react-query';
import { useNotes } from '@/hooks/useNotes';
import { useScannedCaloriesAnalytics } from '@/hooks/useScannedCaloriesAnalytics';
import MarkdownText from '@/components/MarkdownText';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TODAY_INDEX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const MEAL_TYPES = [
  { name: 'Desayuno', icon: '☕', type: 'breakfast', ratio: 0.30 },
  { name: 'Almuerzo', icon: '🍱', type: 'lunch', ratio: 0.35 },
  { name: 'Cena', icon: '🍽️', type: 'dinner', ratio: 0.25 },
  { name: 'Snacks', icon: '🍎', type: 'snack', ratio: 0.10 },
];

const WATER_CUPS = 8;
const DEFAULT_CUP_SIZE = 250;

export default function DashboardScreen() {
  const { colors, isDark } = useThemeColors();
  const s = React.useMemo(() => getStyles(colors, isDark, SHADOWS), [colors, isDark]);
  const { user } = useAuthStore();
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const { data: totals, isLoading: totalsLoading } = useDailyTotals(selectedDate);
  const { profile, nutritionGoals, hydrationGoals, isLoading: profileLoading } = useProfile();
  const { data: meals, isLoading: mealsLoading } = useMealsByDate(user?.id || '', selectedDate);
  const { mutate: addWater } = useAddWater();
  const { mutate: addBodyMetric } = useAddBodyMetric();

  const [hydrationVisible, setHydrationVisible] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const { note, saveNote } = useNotes(selectedDate);
  const [tempNote, setTempNote] = useState('');
  const [weight, setWeight] = useState(profile?.weight_value || 70.0);
  const { data: scannedAnalytics } = useScannedCaloriesAnalytics(user?.id, selectedDate);
  const { message: coachMessage, refresh: refreshCoachMessage } = useCoachMessage('general');

  // Water feedback animation
  const waterFeedbackAnim = useRef(new Animated.Value(0)).current;
  const [showWaterFeedback, setShowWaterFeedback] = useState(false);
  const waterProgressAnim = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);
  const [pendingWater, setPendingWater] = useState(0);

  const waterMl = (totals?.water || 0) + pendingWater;
  const waterGoal = hydrationGoals?.target || 2000;
  const waterCupsFilled = Math.round((waterMl / waterGoal) * WATER_CUPS);

  // Cup animations
  const cupAnims = useRef(Array.from({ length: WATER_CUPS - 1 }).map(() => new Animated.Value(0))).current;

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Sync weight when profile loads
  React.useEffect(() => {
    if (profile?.weight_value) {
      setWeight(profile.weight_value);
    }
  }, [profile?.weight_value]);

  useEffect(() => {
    setTempNote(note);
  }, [note, showNoteModal]);

  useEffect(() => {
    cupAnims.forEach((anim: Animated.Value, i: number) => {
      Animated.spring(anim, {
        toValue: i < waterCupsFilled ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    });
  }, [waterCupsFilled]);

  // Clear pending water when totals actually update from server
  useEffect(() => {
    if (totals?.water !== undefined && pendingWater > 0) {
      setPendingWater(0);
    }
  }, [totals?.water]);

  // Liquid refill animation
  useEffect(() => {
    if (barWidth > 0) {
      const percentage = Math.min(waterMl / waterGoal, 1);
      Animated.spring(waterProgressAnim, {
        toValue: barWidth * percentage,
        useNativeDriver: false,
        tension: 15,
        friction: 6,
      }).start();
    }
  }, [waterMl, waterGoal, barWidth]);

  // Generate calendar days for the month view
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (days.length >= 42) break; // 6 weeks max
    }

    return days;
  };

  const handleAddWater = (amount: number) => {
    // Optimistic update - show immediately
    setPendingWater(prev => prev + amount);
    
    addWater({ volume: amount, unit: 'ml' });

    // Feedback animation
    setShowWaterFeedback(true);
    waterFeedbackAnim.setValue(0);
    Animated.sequence([
      Animated.spring(waterFeedbackAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(waterFeedbackAnim, {
        toValue: 0,
        duration: 500,
        delay: 800,
        useNativeDriver: true,
      })
    ]).start(() => setShowWaterFeedback(false));

    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
  };

  const handleDeleteNote = () => {
    Alert.alert(
      'Eliminar Nota',
      '¿Estás seguro de que quieres eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            saveNote(''); // Guardar string vacío elimina la nota
          }
        }
      ]
    );
  };

  const calGoal = nutritionGoals?.calories || 2500;
  const totalConsumed = totals?.calories || 0;
  const totalBurned = (totals as any)?.burned || 0;
  // Use net calories for remaining (goal + burned - consumed)
  const totalRemaining = Math.max(0, (calGoal + totalBurned) - totalConsumed);

  // Dynamic meal goals proportional to current calorie goal
  const mealsWithGoals = MEAL_TYPES.map(m => ({
    ...m,
    target: Math.round(calGoal * m.ratio)
  }));

  // Calculate calories per meal type
  const mealKcalMap = React.useMemo(() => {
    return (meals || []).reduce((acc: any, meal: any) => {
      const kcal = meal.food_items?.reduce((sum: number, item: any) => sum + (item.calories || 0), 0) || 0;
      let type = meal.meal_type; // 'breakfast', 'lunch' etc

      // Standardize types for aggregation
      if (type?.includes('snack')) type = 'snack';

      if (!acc[type]) acc[type] = 0;
      acc[type] += kcal;
      return acc;
    }, {});
  }, [meals]);

  if (totalsLoading || profileLoading || mealsLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary.amber} />
        <Text style={{ color: colors.text.secondary, marginTop: SPACING.md }}>Cargando datos...</Text>
      </View>
    );
  }


  const MEAL_TYPE_MAP: any = {
    'Desayuno': 'breakfast',
    'Almuerzo': 'lunch',
    'Cena': 'dinner',
    'Snacks': 'snack'
  };

  return (
    <SafeAreaView style={s.container}>
      <ExpoStatusBar style={isDark ? 'light' : 'dark'} translucent />
      {/* ── Top Header ─────────────────────────────── */}
      <View style={s.topBar}>
        <View>
          <Text style={s.todayTitle}>
            {isToday ? 'Hoy' : selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
          <Text style={s.weekLabel}>
            {isToday ? 'Semana 1' : selectedDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={s.topIcons}>
          <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)}>
            <Ionicons name="calendar-outline" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Expandable Calendar ──────────────────────── */}
      {showCalendar && (
        <View style={s.calendarContainer}>
          <View style={s.calendarHeader}>
            <TouchableOpacity onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}>
              <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={s.calendarTitle}>
              {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}>
              <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={s.calendarGrid}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
              <Text key={i} style={s.calendarDayHeader}>{day}</Text>
            ))}
            {generateCalendarDays(selectedDate).map((day, i) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = day.toDateString() === selectedDate.toDateString();
              const isCurrentMonth = day.getMonth() === selectedDate.getMonth();

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.calendarDay,
                    isToday && s.calendarDayToday,
                    isSelected && s.calendarDaySelected,
                    !isCurrentMonth && s.calendarDayOtherMonth
                  ]}
                  onPress={() => {
                    setSelectedDate(day);
                    setShowCalendar(false);
                  }}
                >
                  <Text style={[
                    s.calendarDayText,
                    isToday && s.calendarDayTextToday,
                    isSelected && s.calendarDayTextSelected,
                    !isCurrentMonth && s.calendarDayTextOtherMonth
                  ]}>
                    {day.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Day Strip ──────────────────────────────── */}
      <View style={s.dayStrip}>
        {DAYS.map((d, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (TODAY_INDEX - i));
          const isActive = date.toDateString() === selectedDate.toDateString();

          return (
            <TouchableOpacity
              key={i}
              style={[s.dayCell, isActive && s.dayCellActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[s.dayLetter, isActive && s.dayLetterActive]}>{d}</Text>
              <Text style={[s.dayNumber, isActive && s.dayNumberActive]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SECTION: DAY STATUS BAR (PREMIUM) ── */}
        <View style={s.statusCard}>
          <View style={s.statusCardInner}>
            {/* Header Integrated */}
            <View style={s.statusHeaderRow}>
              <Text style={s.statusTitle}>Calorías</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
                <Text style={s.sectionAction}>Detalles</Text>
              </TouchableOpacity>
            </View>

            <View style={s.statusMainContentVertical}>
              {/* Calorie Progress Circle - Centered Top */}
              <View style={s.calorieStatusContainerCentered}>
                <View style={s.calorieCircleBase}>
                  <Animated.View style={[
                    s.calorieCircleFill,
                    {
                      height: `${Math.min((totalConsumed / calGoal) * 100, 100)}%`,
                      backgroundColor: totalConsumed > calGoal ? colors.status.error : colors.primary.amber
                    }
                  ]} />
                  <View style={s.calorieCircleCenter}>
                    <Text style={s.calorieValueTextLarge}>{totalConsumed.toLocaleString()}</Text>
                    <Text style={s.calorieLabelText}>kcal</Text>
                  </View>
                </View>
                <Text style={s.remainingText}>
                  {totalRemaining > 0 ? `${totalRemaining} kcal restantes` : 'Límite alcanzado'}
                </Text>
              </View>

              <View style={s.coachBubble}>
                <TouchableOpacity onPress={refreshCoachMessage} activeOpacity={0.7} style={s.coachRefreshBtn}>
                  <Ionicons name="refresh-circle" size={28} color={colors.primary.amber} />
                </TouchableOpacity>
                <MarkdownText 
                  content={`"${coachMessage}"`} 
                  style={s.coachMessage} 
                  boldStyle={{ color: colors.primary.amber, fontWeight: '800' }}
                />
              </View>

              {/* Space Divider */}
              <View style={s.statusDivider} />

              {/* Macros Breakdown - Row Bottom */}
              <View style={s.macrosCirclesRow}>
                {[
                  { label: 'Prot.', current: totals?.protein || 0, goal: nutritionGoals?.protein || 180, color: '#FBBF24' },
                  { label: 'Carbs', current: totals?.carbs || 0, goal: nutritionGoals?.carbs || 300, color: colors.primary.sky },
                  { label: 'Grasas', current: totals?.fat || 0, goal: nutritionGoals?.fat || 70, color: '#F97316' },
                ].map((m) => {
                  const pct = m.goal > 0 ? Math.min((m.current / m.goal), 1) : 0;
                  return (
                    <View key={m.label} style={s.macroCircleContainer}>
                      <View style={[s.macroCircleOuter, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                        <View style={[s.macroCircleInner, {
                          borderColor: m.color,
                          borderTopColor: m.color,
                          borderRightColor: pct >= 0.25 ? m.color : 'transparent',
                          borderBottomColor: pct >= 0.5 ? m.color : 'transparent',
                          borderLeftColor: pct >= 0.75 ? m.color : 'transparent',
                          borderWidth: 3,
                          transform: [{ rotate: '45deg' }]
                        }]} />
                        <Text style={s.macroPctText}>{Math.round(pct * 100)}%</Text>
                      </View>
                      <Text style={s.macroCircleLabel}>{m.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ── Health Score Card ───────────────────── */}
        <HealthScoreCard
          date={selectedDate.toISOString().split('T')[0]}
          processedRatioToday={scannedAnalytics?.ratio}
          onRefresh={() => {
            // Refresh daily totals and health score
            queryClient.invalidateQueries({ queryKey: ['daily_totals'] });
            queryClient.invalidateQueries({ queryKey: ['health_score'] });
          }}
        />

        {/* ── SECTION: NUTRITION ───────────────────── */}
        <SectionHeader
          title="Nutrición"
          action="Más"
          onActionPress={() => navigation.navigate('Progress')}
          colors={colors} s={s} />
        <View style={s.card}>
          {mealsWithGoals.map((meal, idx) => {
            const consumed = Math.round(mealKcalMap[meal.type] || 0);
            return (
              <React.Fragment key={meal.name}>
                <View style={s.mealRow}>
                  <View style={s.mealIcon}>
                    <Text style={{ fontSize: 22 }}>{meal.icon}</Text>
                  </View>
                  <View style={s.mealInfo}>
                    <Text style={s.mealName}>{meal.name} →</Text>
                    <Text style={s.mealKcal}>{consumed} / {meal.target.toLocaleString()} kcal</Text>
                  </View>
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={() => navigation.navigate('MealLogger', { mealType: MEAL_TYPE_MAP[meal.name] })}
                  >
                    <Ionicons name="add" size={22} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
                {idx < MEAL_TYPES.length - 1 && <View style={s.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── SECTION: ALIMENTOS ESCANEADOS ─────────── */}
        {scannedAnalytics && (
          <>
            <SectionHeader
              title="Alimentos escaneados"
              colors={colors} s={s} />
            <View style={s.card}>
              <Text style={s.scanSummary}>
                {scannedAnalytics.totalCalories > 0
                  ? `${scannedAnalytics.ratio}% de tus calorías de hoy provienen de productos escaneados (${scannedAnalytics.scannedCalories.toLocaleString()} kcal).`
                  : 'Aún no hay datos de calorías para hoy.'}
              </Text>

              {scannedAnalytics.topProducts.length > 0 ? (
                <View style={s.scanList}>
                  {scannedAnalytics.topProducts.map((p, idx) => (
                    <View key={`${p.barcode_number || idx}-${idx}`} style={s.scanItem}>
                      <View style={s.scanBullet} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.scanName}>{p.name || 'Producto sin nombre'}</Text>
                        <Text style={s.scanDetail}>
                          {p.total_calories_from_scans.toLocaleString()} kcal totales · {p.times_scanned} escaneos
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </>
        )}

        {/* ── SECTION: WATER TRACKER ───────────────── */}
        <SectionHeader
          title="Hidratación"
          action="Detalle"
          onActionPress={() => navigation.navigate('Hydration')}
          colors={colors} s={s} />
        <View style={s.waterCard}>
          <View style={s.waterInfo}>
            <View style={s.waterHeaderRow}>
              <View>
                <Text style={s.waterBigNum}>
                  {waterMl >= 1000 ? `${(waterMl / 1000).toFixed(2)}` : `${waterMl}`}
                  <Text style={s.waterUnitLabel}> {waterMl >= 1000 ? 'L' : 'ml'}</Text>
                </Text>
                <Text style={s.waterGoalLabel}>Meta diaria: {(waterGoal / 1000).toFixed(2)} L</Text>
              </View>
              <TouchableOpacity
                style={s.waterQuickAdd}
                onPress={() => handleAddWater(DEFAULT_CUP_SIZE)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.primary.sky, '#0284C7']}
                  style={s.waterAddIconCircle}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={s.waterProgressWrapper}>
              <View
                style={s.waterProgressBarBase}
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              >
                <Animated.View style={[
                  s.waterProgressBarFill,
                  { width: waterProgressAnim }
                ]}>
                  <LinearGradient
                    colors={['#7DD3FC', '#38BDF8', colors.primary.sky]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
              <Text style={s.waterPercentageText}>{Math.round(Math.min((waterMl / waterGoal) * 100, 100))}%</Text>
            </View>
          </View>

          {showWaterFeedback && (
            <Animated.View style={[
              s.waterFeedback,
              {
                opacity: waterFeedbackAnim,
                transform: [
                  {
                    translateY: waterFeedbackAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -25],
                    })
                  }
                ]
              }
            ]}>
              <Text style={s.waterFeedbackText}>+{DEFAULT_CUP_SIZE}ml</Text>
            </Animated.View>
          )}
        </View>

        {/* ── SECTION: MEASUREMENTS ────────────────── */}
        <SectionHeader
          title="Mediciones"
          action="Más"
          onActionPress={() => navigation.navigate('Progress')}
          colors={colors} s={s} />
        <View style={s.card}>
          <Text style={s.measTitle}>Peso</Text>
          <Text style={s.measGoal}>Meta: {profile?.nutrition_goal?.includes('kg') ? profile.nutrition_goal : '---'}</Text>
          <View style={s.weightRow}>
            <TouchableOpacity
              style={s.weightBtn}
              onPress={() => {
                const newWeight = parseFloat((weight - 0.1).toFixed(1));
                setWeight(newWeight);
                addBodyMetric({ weight_value: newWeight });
              }}
            >
              <Ionicons name="remove-circle-outline" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={s.weightNum}>{weight.toFixed(1)} kg</Text>
            <TouchableOpacity
              style={s.weightBtn}
              onPress={() => {
                const newWeight = parseFloat((weight + 0.1).toFixed(1));
                setWeight(newWeight);
                addBodyMetric({ weight_value: newWeight });
              }}
            >
              <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION: ACTIVITIES ──────────────────── */}
        <SectionHeader
          title="Actividades"
          action="Más"
          onActionPress={() => navigation.navigate('Preferences')}
          colors={colors} s={s} />
        <View style={[s.card, s.activityCard]}>
          <View style={s.activityContent}>
            <Text style={{ fontSize: 32 }}>👟</Text>
            <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
              <Text style={s.actTitle}>Pasos</Text>
              <Text style={s.actSub}>Seguimiento automático</Text>
            </View>
            <Text style={{ fontSize: 32 }}>🏃</Text>
          </View>
          <TouchableOpacity
            style={s.connectBtn}
            onPress={() => navigation.navigate('Preferences')}
          >
            <Text style={s.connectBtnText}>Conectar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Steps')}
          >
            <Text style={s.manualLink}>Registrar pasos manualmente</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION: NOTAS ───────────────────────── */}
        <SectionHeader title="Notas" colors={colors} s={s} />
        <View style={[s.card, s.notesCard]}>
          {note ? (
            <View>
              <View style={s.notesHeader}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary.amber} />
                <Text style={s.notesHeaderText}>Entrada del día</Text>
                <View style={s.notesActions}>
                  <TouchableOpacity onPress={() => setShowNoteModal(true)} style={s.noteActionBtn}>
                    <Ionicons name="pencil" size={16} color={colors.text.tertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteNote()} style={s.noteActionBtn}>
                    <Ionicons name="trash" size={16} color={colors.status.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={s.noteDisplay}>{note}</Text>
            </View>
          ) : (
            <>
              <View style={s.notesContent}>
                <Text style={{ fontSize: 32 }}>☀️</Text>
                <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
                  <Text style={s.actTitle}>¿Cómo fue tu día?</Text>
                  <Text style={s.actSub}>Registra tu salud y emociones</Text>
                </View>
                <Text style={{ fontSize: 32 }}>🌧️</Text>
              </View>
              <TouchableOpacity
                style={s.noteBtn}
                onPress={() => setShowNoteModal(true)}
              >
                <Text style={s.noteBtnText}>Añadir nota</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: SPACING['3xl'] * 2 }} />
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Diario Personal</Text>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={s.noteInput}
              multiline
              placeholder="¿Cómo te sientes hoy? ¿Alguna observación especial?"
              placeholderTextColor={colors.text.tertiary}
              value={tempNote}
              onChangeText={setTempNote}
              autoFocus
            />

            <TouchableOpacity
              style={s.saveNoteBtn}
              onPress={() => {
                saveNote(tempNote);
                setShowNoteModal(false);
              }}
            >
              <Text style={s.saveNoteBtnText}>Guardar Nota</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <HydrationModal
        visible={hydrationVisible}
        onClose={() => setHydrationVisible(false)}
        onAdd={handleAddWater}
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title, action, actionColor, onActionPress, colors, s }: {
  title: string;
  action?: string;
  actionColor?: string;
  onActionPress?: () => void;
  colors: any;
  s: any;
}) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean, shadows: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  todayTitle: { fontSize: FONTS.sizes['4xl'], fontWeight: '900', color: colors.text.primary, fontFamily: FONTS.primary },
  weekLabel: { fontSize: FONTS.sizes.sm, color: colors.text.secondary, fontFamily: FONTS.primary, marginTop: 2 },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  iconBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeNum: { color: colors.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  dayCell: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20 },
  dayCellActive: { backgroundColor: colors.primary.amber },
  dayLetter: { fontSize: FONTS.sizes.xs, color: colors.text.secondary, fontFamily: FONTS.primary, marginBottom: 2 },
  dayLetterActive: { color: colors.background.primary },
  dayNumber: { fontSize: FONTS.sizes.base, fontWeight: '700', color: colors.text.primary, fontFamily: FONTS.primary },
  dayNumberActive: { color: colors.background.primary },

  scroll: { paddingHorizontal: SPACING.xl },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: colors.text.primary, fontFamily: FONTS.primary },
  sectionAction: { fontSize: FONTS.sizes.base, fontWeight: '600', fontFamily: FONTS.primary, color: colors.primary.amber },

  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    ...shadows.lg,
  },

  // ─── Status Bar (Day Summary / Premium) ───
  statusCard: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    ...shadows.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  statusCardInner: {
    padding: SPACING.xl,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },
  statusMainContentVertical: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: SPACING.md,
  },
  calorieStatusContainerCentered: {
    alignItems: 'center',
  },
  calorieValueTextLarge: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },

  calorieCircleBase: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  calorieCircleFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    opacity: 0.9,
  },
  calorieCircleCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  calorieStatusContainer: {
    alignItems: 'center',
    marginRight: SPACING.xl,
  },
  calorieValueText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },
  calorieLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.amber,
    marginTop: 6,
    fontFamily: FONTS.primary,
  },
  macrosCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingVertical: SPACING.sm,
  },
  macroCircleContainer: {
    alignItems: 'center',
    gap: 6,
  },
  macroCircleOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroCircleInner: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  macroPctText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },
  macroCircleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONTS.primary,
  },

  // Nutrition
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  mealIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  mealInfo: { flex: 1 },
  mealName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: colors.text.primary, fontFamily: FONTS.primary },
  mealKcal: { fontSize: FONTS.sizes.xs, color: colors.text.secondary, fontFamily: FONTS.primary, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' },
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },

  // Water Tracker Harmonic Redesign
  waterCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    ...shadows.lg,
  },
  waterInfo: {
    gap: SPACING.lg,
  },
  waterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterBigNum: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
    letterSpacing: -1,
  },
  waterUnitLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.primary,
  },
  waterGoalLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.primary,
    marginTop: -2,
  },
  waterQuickAdd: {
    width: 52,
    height: 52,
    borderRadius: 26,
    ...shadows.md,
  },
  waterAddIconCircle: {
    flex: 1,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary.sky,
  },
  waterProgressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  waterProgressBarBase: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  waterProgressBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  waterPercentageText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary.sky,
    fontFamily: FONTS.primary,
    width: 45,
    textAlign: 'right',
  },
  waterFeedback: {
    position: 'absolute',
    top: 10,
    right: 70,
    zIndex: 10,
    backgroundColor: colors.primary.sky,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  waterFeedbackText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
    fontFamily: FONTS.primary,
  },

  // Measurements
  measTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#FFFFFF', fontFamily: FONTS.primary, textAlign: 'center' },
  measGoal: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.primary, textAlign: 'center', marginBottom: SPACING.md },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
  weightBtn: { padding: SPACING.sm },
  weightNum: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: '#FFFFFF', fontFamily: FONTS.primary },

  // Activities
  activityCard: { gap: SPACING.md },
  activityContent: { flexDirection: 'row', alignItems: 'center' },
  actTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: '#FFFFFF', fontFamily: FONTS.primary },
  actSub: { fontSize: FONTS.sizes.xs, color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.primary },
  connectBtn: { backgroundColor: colors.primary.amber, borderRadius: BORDER_RADIUS.full, paddingVertical: SPACING.md, alignItems: 'center' },
  connectBtnText: { color: '#000000', fontFamily: FONTS.primary, fontWeight: '800', fontSize: FONTS.sizes.base },
  manualLink: { color: colors.primary.sky, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: SPACING.xs },

  // Notes
  notesCard: { gap: SPACING.md },
  notesContent: { flexDirection: 'row', alignItems: 'center' },
  noteBtn: { backgroundColor: colors.primary.amber, borderRadius: BORDER_RADIUS.full, paddingVertical: SPACING.md, alignItems: 'center' },
  noteBtnText: { color: '#000000', fontFamily: FONTS.primary, fontWeight: '800', fontSize: FONTS.sizes.base },

  // Calendar
  calendarContainer: {
    backgroundColor: colors.background.card,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  calendarTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    textTransform: 'capitalize',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: '14%',
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  calendarDay: {
    width: '14%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: SPACING.xs,
  },
  calendarDayToday: {
    backgroundColor: colors.primary.sky,
  },
  calendarDaySelected: {
    backgroundColor: colors.primary.amber,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  notesActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  noteActionBtn: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  notesHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteDisplay: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
    fontFamily: FONTS.primary,
  },
  coachBubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(252,211,77,0.05)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.15)',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  coachRefreshBtn: {
    padding: 2,
  },
  coachMessage: {
    flex: 1,
    color: colors.primary.amber,
    fontFamily: FONTS.primary,
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: RNPlatform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  noteInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 16,
    padding: SPACING.md,
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: FONTS.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: SPACING.xl,
  },
  saveNoteBtn: {
    backgroundColor: colors.primary.amber,
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveNoteBtnText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
  },
  calendarDayText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  calendarDayTextToday: {
    color: colors.background.primary,
  },
  calendarDayTextSelected: {
    color: colors.background.primary,
  },
  calendarDayTextOtherMonth: {
    color: colors.text.secondary,
  },
  scanSummary: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  scanList: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scanBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.sky,
  },
  scanName: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    fontWeight: '600',
  },
  scanDetail: {
    fontSize: FONTS.sizes.xs,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
});
