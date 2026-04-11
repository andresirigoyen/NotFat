import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWorkouts, useAddWorkout, useWorkoutStats, useUserSports, useUpdateUserSports } from '@/hooks/useWorkouts';
import { useProfile } from '@/hooks/useProfile';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const SPORT_TYPES = [
  'Correr',
  'Caminar',
  'Ciclismo',
  'Natación',
  'Pesas',
  'Yoga',
  'Crossfit',
  'Baile',
  'Fútbol',
  'Basketball',
  'Tenis',
  'Otro',
];

const WORKOUT_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
  { label: '120 min', value: 120 },
];

export default function WorkoutsScreen() {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { profile } = useProfile();
  const { data: workouts, isLoading } = useWorkouts(profile?.id || '');
  const { data: stats } = useWorkoutStats(profile?.id || '');
  const { data: userSports } = useUserSports(profile?.id || '');
  
  const { mutate: addWorkout, isPending: adding } = useAddWorkout();
  const { mutate: updateSports, isPending: updatingSports } = useUpdateUserSports();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [estimatedCalories, setEstimatedCalories] = useState(200);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleAddWorkout = () => {
    if (!selectedSport) {
      Alert.alert('Error', 'Por favor selecciona un tipo de ejercicio');
      return;
    }

    addWorkout({
      sport_type: selectedSport,
      duration_minutes: selectedDuration,
      estimated_calories: estimatedCalories,
      workout_date: selectedDate.toISOString().split('T')[0],
    });

    // Reset form
    setShowAddForm(false);
    setSelectedSport('');
    setSelectedDuration(30);
    setEstimatedCalories(200);
  };

  const renderWorkoutCard = (workout: any) => (
    <View key={workout.id} style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <Text style={styles.workoutSport}>{workout.sport_type}</Text>
        <Text style={styles.workoutDate}>
          {new Date(workout.workout_date).toLocaleDateString('es-CL')}
        </Text>
      </View>
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color={colors.primary.amber} />
          <Text style={styles.statText}>{workout.duration_minutes} min</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="flame" size={16} color={colors.status.error} />
          <Text style={styles.statText}>{workout.estimated_calories} kcal</Text>
        </View>
      </View>
    </View>
  );

  const renderSportStat = (sport: string, stat: any) => (
    <View key={sport} style={styles.sportStatCard}>
      <Text style={styles.sportName}>{sport}</Text>
      <View style={styles.sportStats}>
        <View style={styles.sportStatItem}>
          <Text style={styles.sportStatValue}>{stat.count}</Text>
          <Text style={styles.sportStatLabel}>sesiones</Text>
        </View>
        <View style={styles.sportStatItem}>
          <Text style={styles.sportStatValue}>{stat.minutes}</Text>
          <Text style={styles.sportStatLabel}>minutos</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Ejercicios</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={24} color={colors.primary.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Estadísticas (30 días)</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Entrenamientos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalMinutes}</Text>
                <Text style={styles.statLabel}>Minutos Totales</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalCalories}</Text>
                <Text style={styles.statLabel}>Calorías Quemadas</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.avgMinutes}</Text>
                <Text style={styles.statLabel}>Minutos Promedio</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sport Stats */}
        {stats?.sportStats && Object.keys(stats.sportStats).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Por Deporte</Text>
            {Object.entries(stats.sportStats).map(([sport, stat]) => renderSportStat(sport, stat))}
          </View>
        )}

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrenamientos Recientes</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          ) : workouts && workouts.length > 0 ? (
            workouts.map(renderWorkoutCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="fitness" size={48} color={colors.text.muted} />
              <Text style={styles.emptyText}>No tienes entrenamientos registrados</Text>
              <Text style={styles.emptySub}>Agrega tu primer entrenamiento</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Workout Modal */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Entrenamiento</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Date Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Fecha</Text>
              <View style={styles.dateSelector}>
                <TouchableOpacity 
                  style={[styles.dateOption, selectedDate.toDateString() === new Date().toDateString() && styles.dateOptionSelected]}
                  onPress={() => setSelectedDate(new Date())}
                >
                  <Text style={[styles.dateOptionText, selectedDate.toDateString() === new Date().toDateString() && styles.dateOptionTextSelected]}>Hoy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dateOption, selectedDate.toDateString() === new Date(Date.now() - 86400000).toDateString() && styles.dateOptionSelected]}
                  onPress={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setSelectedDate(yesterday);
                  }}
                >
                  <Text style={[styles.dateOptionText, selectedDate.toDateString() === new Date(Date.now() - 86400000).toDateString() && styles.dateOptionTextSelected]}>Ayer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sport Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Tipo de Ejercicio</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportOptions}>
                {SPORT_TYPES.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.sportOption,
                      selectedSport === sport && styles.sportOptionSelected
                    ]}
                    onPress={() => setSelectedSport(sport)}
                  >
                    <Text style={[
                      styles.sportOptionText,
                      selectedSport === sport && styles.sportOptionTextSelected
                    ]}>
                      {sport}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Duration Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Duración</Text>
              <View style={styles.durationOptions}>
                {WORKOUT_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration.value}
                    style={[
                      styles.durationOption,
                      selectedDuration === duration.value && styles.durationOptionSelected
                    ]}
                    onPress={() => setSelectedDuration(duration.value)}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      selectedDuration === duration.value && styles.durationOptionTextSelected
                    ]}>
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calories Input */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Calorías Estimadas</Text>
              <TextInput
                style={styles.caloriesInput}
                value={estimatedCalories.toString()}
                onChangeText={(text) => setEstimatedCalories(parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="200"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, (!selectedSport || adding) && styles.submitButtonDisabled]}
              onPress={handleAddWorkout}
              disabled={!selectedSport || adding}
            >
              {adding ? (
                <Text style={styles.submitButtonText}>Guardando...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Agregar Entrenamiento</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  addButton: {
    padding: SPACING.sm,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  statsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  statNumber: {
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: colors.primary.amber,
    fontFamily: FONTS.primary,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  sportStatCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  sportName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  sportStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  sportStatItem: {
    alignItems: 'center',
  },
  sportStatValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: colors.primary.amber,
    fontFamily: FONTS.primary,
  },
  sportStatLabel: {
    fontSize: FONTS.sizes.xs,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  workoutCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  workoutSport: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  workoutDate: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    fontSize: FONTS.sizes.base,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  sportOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sportOption: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sportOptionSelected: {
    backgroundColor: colors.primary.amber,
    borderColor: colors.primary.amber,
  },
  sportOptionText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  sportOptionTextSelected: {
    color: colors.background.primary,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  durationOption: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  durationOptionSelected: {
    backgroundColor: colors.primary.amber,
    borderColor: colors.primary.amber,
  },
  durationOptionText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  durationOptionTextSelected: {
    color: colors.background.primary,
  },
  caloriesInput: {
    backgroundColor: colors.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  submitButton: {
    backgroundColor: colors.primary.amber,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: colors.background.primary,
    fontFamily: FONTS.primary,
  },
  dateSelector: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.background.border,
    alignItems: 'center',
  },
  dateOptionSelected: {
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderColor: colors.primary.amber,
  },
  dateOptionText: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    fontWeight: FONTS.weights.medium,
  },
  dateOptionTextSelected: {
    color: colors.primary.amber,
    fontWeight: FONTS.weights.bold,
  },
});
