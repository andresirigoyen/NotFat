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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '@/types/navigation';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import HydrationModal from '@/components/HydrationModal';
import HealthScoreCard from '@/components/HealthScoreCard';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useProfile } from '@/hooks/useProfile';
import { useWaterLogs, useAddWater } from '@/hooks/useWaterLogs';
import { useBodyMetrics, useAddBodyMetric } from '@/hooks/useBodyMetrics';
import { useMealsByDate } from '@/hooks/useMeals';
import { useAuthStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { useNotes } from '@/hooks/useNotes';
import { Modal, TextInput, KeyboardAvoidingView, Platform as RNPlatform } from 'react-native';
import { useScannedCaloriesAnalytics } from '@/hooks/useScannedCaloriesAnalytics';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TODAY_INDEX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const MEALS = [
  { name: 'Desayuno', icon: '☕', target: 929 },
  { name: 'Almuerzo', icon: '🍱', target: 1238 },
  { name: 'Cena', icon: '🍽️', target: 774 },
  { name: 'Snacks', icon: '🍎', target: 155 },
];

const WATER_CUPS = 8;
const DEFAULT_CUP_SIZE = 250;

export default function DashboardScreen() {
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

  // Water feedback animation
  const waterFeedbackAnim = useRef(new Animated.Value(0)).current;
  const [showWaterFeedback, setShowWaterFeedback] = useState(false);

  const waterMl = totals?.water || 0;
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

  const calGoal = nutritionGoals?.calories || 3095;
  const totalConsumed = totals?.calories || 0;
  const totalBurned = (totals as any)?.burned || 0;
  const totalRemaining = Math.max(0, (calGoal + totalBurned) - totalConsumed);

  if (totalsLoading || profileLoading || mealsLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary.amber} />
        <Text style={{ color: COLORS.text.secondary, marginTop: SPACING.md }}>Cargando datos...</Text>
      </View>
    );
  }

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

  const MEAL_TYPE_MAP: any = {
    'Desayuno': 'breakfast',
    'Almuerzo': 'lunch',
    'Cena': 'dinner',
    'Snacks': 'snack'
  };

  return (
    <SafeAreaView style={s.container}>
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
            <Ionicons name="calendar-outline" size={24} color={COLORS.text.secondary} />
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
              <Ionicons name="chevron-back" size={20} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={s.calendarTitle}>
              {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.primary} />
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
        {/* ── SECTION: SUMMARY ──────────────────────── */}
        <SectionHeader 
          title="Calorías" 
          action="Detalles" 
          actionColor={COLORS.primary.sky}
          onActionPress={() => navigation.navigate('Stats')}
        />
        <View style={s.card}>
          {/* Calorie Gauge */}
          <View style={s.calorieGaugeContainer}>
            <View style={s.calorieGaugeArc}>
              <View style={s.calorieGaugeFill} />
              <View style={s.calorieGaugeInner}>
                <Text style={s.calorieTodayLabel}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={s.calorieMain}>{totalConsumed.toLocaleString()} kcal</Text>
                <Text style={s.calorieSub}>
                  Calorías restantes {totalRemaining.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Macro Circles */}
          <View style={s.macroCirclesRow}>
            {[
              { label: 'Proteína', current: totals?.protein || 0, goal: nutritionGoals?.protein || 151, color: '#FBBF24' },
              { label: 'Carbos', current: totals?.carbs || 0, goal: nutritionGoals?.carbs || 377, color: COLORS.primary.sky },
              { label: 'Grasas', current: totals?.fat || 0, goal: nutritionGoals?.fat || 100, color: '#F97316' },
            ].map((m) => {
              const pct = m.goal > 0 ? Math.min((m.current / m.goal) * 100, 100) : 0;
              return (
                <View key={m.label} style={s.macroCircle}>
                  <View style={[s.macroCircleOuter, { borderColor: 'rgba(255,255,255,0.08)' }]}>
                    <View style={[s.macroCircleInner, { borderColor: m.color }]} />
                    <Text style={s.macroCircleValue}>{Math.round(pct)}</Text>
                  </View>
                  <Text style={s.macroCircleLabel}>{m.label}</Text>
                </View>
              );
            })}
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
          actionColor={COLORS.primary.sky}
          onActionPress={() => navigation.navigate('Progress')}
        />
        <View style={s.card}>
          {MEALS.map((meal, idx) => {
            const consumed = Math.round(mealKcalMap[MEAL_TYPE_MAP[meal.name]] || 0);
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
                    <Ionicons name="add" size={22} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>
                {idx < MEALS.length - 1 && <View style={s.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── SECTION: ALIMENTOS ESCANEADOS ─────────── */}
        {scannedAnalytics && (
          <>
            <SectionHeader 
              title="Alimentos escaneados" 
            />
            <View style={s.card}>
              <Text style={s.scanSummary}>
                {scannedAnalytics.totalCalories > 0
                  ? `${scannedAnalytics.ratio}% de tus calorías de hoy provienen de productos escaneados (${scannedAnalytics.scannedCalories.toLocaleString()} kcal).`
                  : 'Aún no hay datos de calorías para hoy.'}
              </Text>

              {scannedAnalytics.topProducts.length > 0 && (
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
              )}
            </View>
          </>
        )}

        {/* ── SECTION: WATER TRACKER ───────────────── */}
        <SectionHeader 
          title="Hidratación" 
          action="Más" 
          actionColor={COLORS.primary.sky}
          onActionPress={() => navigation.navigate('Hydration')}
        />
        <View style={s.card}>
          <Text style={s.waterTitle}>Agua</Text>
          <Text style={s.waterGoalLabel}>Meta: {(waterGoal / 1000).toFixed(2)} L</Text>
          <Text style={s.waterBigNum}>
            {waterMl >= 1000 ? `${(waterMl / 1000).toFixed(2)} l` : `${waterMl} ml`}
          </Text>
          
          {showWaterFeedback && (
            <Animated.View style={[
              s.waterFeedback,
              {
                opacity: waterFeedbackAnim,
                transform: [
                  { translateY: waterFeedbackAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -40],
                    }) 
                  },
                  { scale: waterFeedbackAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.2],
                    })
                  }
                ]
              }
            ]}>
              <Text style={s.waterFeedbackText}>+{DEFAULT_CUP_SIZE}ml</Text>
            </Animated.View>
          )}

          {/* Cups row */}
          <View style={s.cupsRow}>
            <TouchableOpacity 
              style={s.addCupBtn} 
              onPress={() => handleAddWater(DEFAULT_CUP_SIZE)}
              onLongPress={() => setHydrationVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={COLORS.primary.sky} />
            </TouchableOpacity>
            {cupAnims.map((anim: Animated.Value, i: number) => (
              <Animated.View 
                key={i} 
                style={[
                  s.cup, 
                  {
                    transform: [{
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1.1],
                      })
                    }],
                    backgroundColor: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(56,189,248,0.1)', COLORS.primary.sky],
                    }) as any,
                    borderColor: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(56,189,248,0.2)', COLORS.primary.sky],
                    }) as any
                  }
                ]} 
              />
            ))}
          </View>
          <Text style={s.waterFromFood}>+ Agua de alimentos: 0 mL</Text>
        </View>

        {/* ── SECTION: MEASUREMENTS ────────────────── */}
        <SectionHeader 
          title="Mediciones" 
          action="Más" 
          actionColor={COLORS.primary.sky}
          onActionPress={() => navigation.navigate('Progress')}
        />
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
              <Ionicons name="remove-circle-outline" size={32} color={COLORS.text.secondary} />
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
              <Ionicons name="add-circle-outline" size={32} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION: ACTIVITIES ──────────────────── */}
        <SectionHeader 
          title="Actividades" 
          action="Más" 
          actionColor={COLORS.primary.sky}
          onActionPress={() => navigation.navigate('Preferences')}
        />
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
        <SectionHeader title="Notas" />
        <View style={[s.card, s.notesCard]}>
          {note ? (
            <View>
              <View style={s.notesHeader}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.primary.amber} />
                <Text style={s.notesHeaderText}>Entrada del día</Text>
                <View style={s.notesActions}>
                  <TouchableOpacity onPress={() => setShowNoteModal(true)} style={s.noteActionBtn}>
                    <Ionicons name="pencil" size={16} color={COLORS.text.tertiary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteNote()} style={s.noteActionBtn}>
                    <Ionicons name="trash" size={16} color={COLORS.status.error} />
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
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={s.noteInput}
              multiline
              placeholder="¿Cómo te sientes hoy? ¿Alguna observación especial?"
              placeholderTextColor={COLORS.text.tertiary}
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

function SectionHeader({ title, action, actionColor, onActionPress }: { 
  title: string; 
  action?: string; 
  actionColor?: string;
  onActionPress?: () => void;
}) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={[s.sectionAction, { color: actionColor || COLORS.primary.amber }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  todayTitle: { fontSize: FONTS.sizes['4xl'], fontWeight: '900', color: COLORS.text.primary, fontFamily: FONTS.primary },
  weekLabel: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, fontFamily: FONTS.primary, marginTop: 2 },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  iconBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeNum: { color: COLORS.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  dayCell: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20 },
  dayCellActive: { backgroundColor: COLORS.primary.amber },
  dayLetter: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary, marginBottom: 2 },
  dayLetterActive: { color: COLORS.background.primary },
  dayNumber: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text.primary, fontFamily: FONTS.primary },
  dayNumberActive: { color: COLORS.background.primary },

  scroll: { paddingHorizontal: SPACING.xl },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.text.primary, fontFamily: FONTS.primary },
  sectionAction: { fontSize: FONTS.sizes.base, fontWeight: '600', fontFamily: FONTS.primary },

  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  // Summary / Calories Gauge
  calorieGaugeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  calorieGaugeArc: {
    width: 220,
    height: 120,
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    borderWidth: 10,
    borderColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  calorieGaugeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    borderWidth: 10,
    borderBottomWidth: 0,
    borderColor: COLORS.primary.amber,
  },
  calorieGaugeInner: {
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  calorieTodayLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: 4,
  },
  calorieMain: {
    fontSize: FONTS.sizes['3xl'],
    fontWeight: '900',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  calorieSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: 2,
  },
  macroCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
  },
  macroCircle: {
    alignItems: 'center',
  },
  macroCircleOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroCircleInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    borderWidth: 4,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  macroCircleValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  macroCircleLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: 4,
  },

  // Nutrition
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md },
  mealIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  mealInfo: { flex: 1 },
  mealName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.text.primary, fontFamily: FONTS.primary },
  mealKcal: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },

  // Water
  waterTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text.primary, fontFamily: FONTS.primary, textAlign: 'center' },
  waterGoalLabel: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary, textAlign: 'center', marginBottom: SPACING.sm },
  waterBigNum: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: COLORS.text.primary, fontFamily: FONTS.primary, textAlign: 'center', marginBottom: SPACING.lg },
  waterFeedback: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: COLORS.primary.sky,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  waterFeedbackText: {
    color: COLORS.background.primary,
    fontWeight: '800',
    fontSize: 14,
    fontFamily: FONTS.primary,
  },
  cupsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.md },
  addCupBtn: { width: 36, height: 52, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary.sky, justifyContent: 'center', alignItems: 'center' },
  cup: { width: 30, height: 52, borderRadius: 5, borderWidth: 2, borderColor: 'rgba(56,189,248,0.3)', backgroundColor: 'rgba(56,189,248,0.06)' },
  cupFilled: { backgroundColor: 'rgba(56,189,248,0.4)', borderColor: COLORS.primary.sky },
  waterFromFood: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary, textAlign: 'center' },

  // Measurements
  measTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text.primary, fontFamily: FONTS.primary, textAlign: 'center' },
  measGoal: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary, textAlign: 'center', marginBottom: SPACING.md },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING['3xl'] },
  weightBtn: { padding: SPACING.sm },
  weightNum: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: COLORS.text.primary, fontFamily: FONTS.primary },

  // Activities
  activityCard: { gap: SPACING.md },
  activityContent: { flexDirection: 'row', alignItems: 'center' },
  actTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.text.primary, fontFamily: FONTS.primary },
  actSub: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary },
  connectBtn: { backgroundColor: COLORS.text.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: SPACING.md, alignItems: 'center' },
  connectBtnText: { color: COLORS.background.primary, fontFamily: FONTS.primary, fontWeight: '800', fontSize: FONTS.sizes.base },
  manualLink: { color: COLORS.primary.sky, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: SPACING.xs },

  // Notes
  notesCard: { gap: SPACING.md },
  notesContent: { flexDirection: 'row', alignItems: 'center' },
  noteBtn: { backgroundColor: COLORS.text.primary, borderRadius: BORDER_RADIUS.full, paddingVertical: SPACING.md, alignItems: 'center' },
  noteBtnText: { color: COLORS.background.primary, fontFamily: FONTS.primary, fontWeight: '800', fontSize: FONTS.sizes.base },

  // Calendar
  calendarContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    color: COLORS.text.primary,
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
    color: COLORS.text.secondary,
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
    backgroundColor: COLORS.primary.sky,
  },
  calendarDaySelected: {
    backgroundColor: COLORS.primary.amber,
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
    color: COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteDisplay: {
    fontSize: 15,
    color: COLORS.text.primary,
    lineHeight: 22,
    fontFamily: FONTS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background.secondary,
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
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  noteInput: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 16,
    padding: SPACING.md,
    color: COLORS.text.primary,
    fontSize: 16,
    fontFamily: FONTS.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    marginBottom: SPACING.xl,
  },
  saveNoteBtn: {
    backgroundColor: COLORS.primary.amber,
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveNoteBtnText: {
    color: COLORS.background.primary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.primary,
  },
  calendarDayText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  calendarDayTextToday: {
    color: COLORS.background.primary,
  },
  calendarDayTextSelected: {
    color: COLORS.background.primary,
  },
  calendarDayTextOtherMonth: {
    color: COLORS.text.secondary,
  },
  scanSummary: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
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
    backgroundColor: COLORS.primary.sky,
  },
  scanName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    fontWeight: '600',
  },
  scanDetail: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
});
