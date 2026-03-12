import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import HydrationModal from '@/components/HydrationModal';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useProfile } from '@/hooks/useProfile';
import { useWaterLogs, useAddWater } from '@/hooks/useWaterLogs';
import { useBodyMetrics, useAddBodyMetric } from '@/hooks/useBodyMetrics';
import { useMealsByDate } from '@/hooks/useMeals';
import { useAuthStore } from '@/store';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TODAY_INDEX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const MEALS = [
  { name: 'Desayuno', icon: '☕', target: 929 },
  { name: 'Almuerzo', icon: '🍱', target: 1238 },
  { name: 'Cena', icon: '🍽️', target: 774 },
  { name: 'Snacks', icon: '🍎', target: 155 },
];

const WATER_CUPS = 8;

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data: totals, isLoading: totalsLoading } = useDailyTotals(selectedDate);
  const { profile, nutritionGoals, hydrationGoals, isLoading: profileLoading } = useProfile();
  const { data: meals, isLoading: mealsLoading } = useMealsByDate(user?.id || '', selectedDate);
  const { mutate: addWater } = useAddWater();
  const { mutate: addBodyMetric } = useAddBodyMetric();
  
  const [hydrationVisible, setHydrationVisible] = useState(false);
  const [weight, setWeight] = useState(profile?.weight_value || 70.0);

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Sync weight when profile loads
  React.useEffect(() => {
    if (profile?.weight_value) {
      setWeight(profile.weight_value);
    }
  }, [profile?.weight_value]);

  const handleAddWater = (amount: number) => {
    addWater({ volume: amount, unit: 'ml' });
  };

  const waterGoal = hydrationGoals?.target || 2000;
  const waterMl = totals?.water || 0;
  const waterCupsFilled = Math.round((waterMl / waterGoal) * WATER_CUPS);

  const calGoal = nutritionGoals?.calories || 3095;
  const totalConsumed = totals?.calories || 0;
  const totalRemaining = Math.max(0, calGoal - totalConsumed);

  if (totalsLoading || profileLoading || mealsLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background.primary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary.amber} />
        <Text style={{ color: COLORS.text.secondary, marginTop: SPACING.md }}>Cargando datos...</Text>
      </View>
    );
  }

  // Calculate calories per meal type
  const mealKcalMap = (meals || []).reduce((acc: any, meal: any) => {
    const kcal = meal.food_items?.reduce((sum: number, item: any) => sum + (item.calories || 0), 0) || 0;
    const type = meal.meal_type; // 'breakfast', 'lunch' etc
    if (!acc[type]) acc[type] = 0;
    acc[type] += kcal;
    return acc;
  }, {});

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
          <Text style={s.todayTitle}>{isToday ? 'Hoy' : selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
          <Text style={s.weekLabel}>Semana 1</Text>
        </View>
        <View style={s.topIcons}>
          <View style={s.iconBadge}><Text>💎</Text><Text style={s.badgeNum}>0</Text></View>
          <View style={s.iconBadge}><Text>🔥</Text><Text style={s.badgeNum}>0</Text></View>
          <Ionicons name="calendar-outline" size={24} color={COLORS.text.secondary} />
        </View>
      </View>

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
        <SectionHeader title="Resumen" action="Detalles" actionColor={COLORS.primary.sky} />
        <View style={s.card}>
          {/* Calorie Ring Row */}
          <View style={s.ringRow}>
            <View style={s.calStat}>
              <Text style={s.calNum}>{totalConsumed.toLocaleString()}</Text>
              <Text style={s.calLabel}>Consumidas</Text>
            </View>
            {/* Ring */}
            <View style={s.ring}>
              <View style={s.ringInner}>
                <Text style={s.ringNum}>{totalRemaining.toLocaleString()}</Text>
                <Text style={s.ringLabel}>Restantes</Text>
              </View>
            </View>
            <View style={s.calStat}>
              <Text style={s.calNum}>0</Text>
              <Text style={s.calLabel}>Quemadas</Text>
            </View>
          </View>

          {/* Macro Bars */}
          <View style={s.macroSection}>
            {[
              { label: 'Carbos', current: totals?.carbs || 0, goal: nutritionGoals?.carbs || 377, color: COLORS.primary.sky },
              { label: 'Proteína', current: totals?.protein || 0, goal: nutritionGoals?.protein || 151, color: '#A78BFA' },
              { label: 'Grasas', current: totals?.fat || 0, goal: nutritionGoals?.fat || 100, color: COLORS.primary.amber },
            ].map((m) => (
              <View key={m.label} style={s.macroItem}>
                <Text style={s.macroLabel}>{m.label}</Text>
                <View style={s.macroBarBg}>
                  <View
                    style={[
                      s.macroBarFill,
                      { width: `${Math.min((m.current / m.goal) * 100, 100)}%`, backgroundColor: m.color },
                    ]}
                  />
                </View>
                <Text style={s.macroGoal}>{m.current} / {m.goal} g</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SECTION: NUTRITION ───────────────────── */}
        <SectionHeader title="Nutrición" action="Más" actionColor={COLORS.primary.sky} />
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
                  <TouchableOpacity style={s.addBtn}>
                    <Ionicons name="add" size={22} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>
                {idx < MEALS.length - 1 && <View style={s.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── SECTION: WATER TRACKER ───────────────── */}
        <SectionHeader title="Hidratación" />
        <View style={s.card}>
          <Text style={s.waterTitle}>Agua</Text>
          <Text style={s.waterGoalLabel}>Meta: {(waterGoal / 1000).toFixed(2)} L</Text>
          <Text style={s.waterBigNum}>
            {waterMl >= 1000 ? `${(waterMl / 1000).toFixed(2)} l` : `${waterMl} ml`}
          </Text>
          {/* Cups row */}
          <View style={s.cupsRow}>
            <TouchableOpacity style={s.addCupBtn} onPress={() => setHydrationVisible(true)}>
              <Ionicons name="add" size={20} color={COLORS.primary.sky} />
            </TouchableOpacity>
            {Array.from({ length: WATER_CUPS - 1 }).map((_, i) => (
              <View key={i} style={[s.cup, i < waterCupsFilled && s.cupFilled]} />
            ))}
          </View>
          <Text style={s.waterFromFood}>+ Agua de alimentos: 0 mL</Text>
        </View>

        {/* ── SECTION: MEASUREMENTS ────────────────── */}
        <SectionHeader title="Mediciones" action="Más" actionColor={COLORS.primary.sky} />
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
        <SectionHeader title="Actividades" action="Más" actionColor={COLORS.primary.sky} />
        <View style={[s.card, s.activityCard]}>
          <View style={s.activityContent}>
            <Text style={{ fontSize: 32 }}>👟</Text>
            <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
              <Text style={s.actTitle}>Pasos</Text>
              <Text style={s.actSub}>Seguimiento automático</Text>
            </View>
            <Text style={{ fontSize: 32 }}>🏃</Text>
          </View>
          <TouchableOpacity style={s.connectBtn}>
            <Text style={s.connectBtnText}>Conectar</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={s.manualLink}>Registrar pasos manualmente</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION: NOTAS ───────────────────────── */}
        <SectionHeader title="Notas" />
        <View style={[s.card, s.notesCard]}>
          <View style={s.notesContent}>
            <Text style={{ fontSize: 32 }}>☀️</Text>
            <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
              <Text style={s.actTitle}>¿Cómo fue tu día?</Text>
              <Text style={s.actSub}>Registra tu salud y emociones</Text>
            </View>
            <Text style={{ fontSize: 32 }}>🌧️</Text>
          </View>
          <TouchableOpacity style={s.noteBtn}>
            <Text style={s.noteBtnText}>Añadir nota</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING['3xl'] * 2 }} />
      </ScrollView>

      <HydrationModal
        visible={hydrationVisible}
        onClose={() => setHydrationVisible(false)}
        onAdd={handleAddWater}
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title, action, actionColor }: { title: string; action?: string; actionColor?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && <TouchableOpacity><Text style={[s.sectionAction, { color: actionColor || COLORS.primary.amber }]}>{action}</Text></TouchableOpacity>}
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

  // Summary / Ring
  ringRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: SPACING.xl },
  calStat: { alignItems: 'center' },
  calNum: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.text.primary, fontFamily: FONTS.primary },
  calLabel: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary, marginTop: 2 },
  ring: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 10, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
    borderLeftColor: COLORS.primary.sky,
    borderBottomColor: COLORS.primary.sky,
  },
  ringInner: { alignItems: 'center' },
  ringNum: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.text.primary, fontFamily: FONTS.primary },
  ringLabel: { fontSize: 10, color: COLORS.text.secondary, fontFamily: FONTS.primary },

  macroSection: { gap: SPACING.md },
  macroItem: {},
  macroLabel: { fontSize: FONTS.sizes.sm, color: COLORS.text.secondary, fontFamily: FONTS.primary, marginBottom: 4 },
  macroBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 3 },
  macroBarFill: { height: 6, borderRadius: 3, minWidth: 6 },
  macroGoal: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary },

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
});
