import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAddHealthSnapshot } from '@/hooks/useHealthDailySnapshots';
import { useHealthStats } from '@/hooks/useHealthDailySnapshots';
import { useAuthStore } from '@/store';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

const QUICK_GOALS = [
  { steps: 5000, label: '5,000', description: 'Básico' },
  { steps: 7500, label: '7,500', description: 'Bueno' },
  { steps: 10000, label: '10,000', description: 'Excelente' },
  { steps: 12000, label: '12,000', description: 'Atleta' },
];

const ACTIVITY_LEVELS = [
  { 
    minutes: 0, 
    label: 'Sedentario', 
    description: 'Poco o ningún ejercicio',
    calories: 0 
  },
  { 
    minutes: 15, 
    label: 'Ligero', 
    description: 'Caminata ligera',
    calories: 100 
  },
  { 
    minutes: 30, 
    label: 'Moderado', 
    description: 'Ejercicio moderado',
    calories: 200 
  },
  { 
    minutes: 45, 
    label: 'Intenso', 
    description: 'Ejercicio intenso',
    calories: 350 
  },
  { 
    minutes: 60, 
    label: 'Muy intenso', 
    description: 'Entrenamiento completo',
    calories: 500 
  },
];

export default function StepsScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { data: stats } = useHealthStats(user?.id || '');
  const { mutate: addSnapshot, isPending } = useAddHealthSnapshot();

  const [steps, setSteps] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITY_LEVELS[1]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleQuickGoal = (goalSteps: number) => {
    setSteps(goalSteps.toString());
    setSelectedGoal(goalSteps);
  };

  const handleSave = async () => {
    const stepsNum = parseInt(steps);
    
    if (!stepsNum || stepsNum < 0 || stepsNum > 100000) {
      Alert.alert('Error', 'Por favor ingresa un número válido de pasos (0-100,000)');
      return;
    }

    try {
      await addSnapshot({
        date,
        steps: stepsNum,
        active_calories_burned: selectedActivity.calories,
        workout_minutes: selectedActivity.minutes,
        workout_count: selectedActivity.minutes > 0 ? 1 : 0,
        source: 'manual',
      });

      Alert.alert(
        '✅ ¡Éxito!',
        `Se registraron ${stepsNum.toLocaleString()} pasos para hoy`
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error saving steps:', error);
      Alert.alert('Error', 'No se pudieron guardar los pasos. Intenta nuevamente.');
    }
  };

  const formatSteps = (value: string) => {
    const num = value.replace(/\D/g, '');
    return num;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar Pasos</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha</Text>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={20} color={COLORS.primary.amber} />
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>

        {/* Steps Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pasos del día</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="walk" size={24} color={COLORS.primary.amber} />
            <TextInput
              style={styles.stepsInput}
              value={steps}
              onChangeText={(text) => setSteps(formatSteps(text))}
              placeholder="0"
              placeholderTextColor={COLORS.text.muted}
              keyboardType="numeric"
              maxLength={6}
            />
            <Text style={styles.stepsLabel}>pasos</Text>
          </View>
          
          {/* Current Average */}
          {stats && (
            <View style={styles.averageContainer}>
              <Text style={styles.averageText}>
                Tu promedio: {stats.avgSteps.toLocaleString()} pasos/día
              </Text>
            </View>
          )}
        </View>

        {/* Quick Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metas rápidas</Text>
          <View style={styles.goalsGrid}>
            {QUICK_GOALS.map((goal) => (
              <TouchableOpacity
                key={goal.steps}
                style={[
                  styles.goalCard,
                  selectedGoal === goal.steps && styles.goalCardSelected
                ]}
                onPress={() => handleQuickGoal(goal.steps)}
              >
                <Text style={[
                  styles.goalSteps,
                  selectedGoal === goal.steps && styles.goalStepsSelected
                ]}>
                  {goal.label}
                </Text>
                <Text style={[
                  styles.goalDescription,
                  selectedGoal === goal.steps && styles.goalDescriptionSelected
                ]}>
                  {goal.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nivel de actividad</Text>
          <View style={styles.activityContainer}>
            {ACTIVITY_LEVELS.map((level, index) => (
              <TouchableOpacity
                key={level.minutes}
                style={[
                  styles.activityCard,
                  selectedActivity.minutes === level.minutes && styles.activityCardSelected
                ]}
                onPress={() => setSelectedActivity(level)}
              >
                <View style={styles.activityHeader}>
                  <Text style={[
                    styles.activityTitle,
                    selectedActivity.minutes === level.minutes && styles.activityTitleSelected
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.activityMinutes,
                    selectedActivity.minutes === level.minutes && styles.activityMinutesSelected
                  ]}>
                    {level.minutes > 0 ? `${level.minutes} min` : 'Sin ejercicio'}
                  </Text>
                </View>
                <Text style={[
                  styles.activityDescription,
                  selectedActivity.minutes === level.minutes && styles.activityDescriptionSelected
                ]}>
                  {level.description}
                </Text>
                {level.calories > 0 && (
                  <Text style={[
                    styles.activityCalories,
                    selectedActivity.minutes === level.minutes && styles.activityCaloriesSelected
                  ]}>
                    ~{level.calories} calorías
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del registro</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Ionicons name="walk" size={20} color={COLORS.primary.amber} />
              <Text style={styles.summaryLabel}>Pasos:</Text>
              <Text style={styles.summaryValue}>
                {steps ? parseInt(steps).toLocaleString() : '0'} pasos
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="flame" size={20} color={COLORS.status.warning} />
              <Text style={styles.summaryLabel}>Calorías:</Text>
              <Text style={styles.summaryValue}>
                ~{selectedActivity.calories} kcal
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="time" size={20} color={COLORS.status.info} />
              <Text style={styles.summaryLabel}>Ejercicio:</Text>
              <Text style={styles.summaryValue}>
                {selectedActivity.minutes} minutos
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, (!steps || isPending) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!steps || isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={COLORS.text.primary} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Registro</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  placeholder: {
    width: 24,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    fontFamily: FONTS.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  stepsInput: {
    flex: 1,
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  stepsLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  averageContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  averageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  goalCard: {
    width: '48%',
    backgroundColor: COLORS.background.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  goalCardSelected: {
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderColor: COLORS.primary.amber,
  },
  goalSteps: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  goalStepsSelected: {
    color: COLORS.primary.amber,
  },
  goalDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
  goalDescriptionSelected: {
    color: COLORS.text.primary,
  },
  activityContainer: {
    gap: SPACING.sm,
  },
  activityCard: {
    backgroundColor: COLORS.background.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    ...SHADOWS.sm,
  },
  activityCardSelected: {
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderColor: COLORS.primary.amber,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  activityTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  activityTitleSelected: {
    color: COLORS.primary.amber,
  },
  activityMinutes: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  activityMinutesSelected: {
    color: COLORS.primary.amber,
  },
  activityDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
  },
  activityDescriptionSelected: {
    color: COLORS.text.primary,
  },
  activityCalories: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
    marginTop: SPACING.xs,
  },
  activityCaloriesSelected: {
    color: COLORS.primary.amber,
  },
  summaryContainer: {
    backgroundColor: COLORS.background.card,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    flex: 1,
  },
  summaryValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary.amber,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.interactive.disabled,
  },
  saveButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.background.primary,
    fontFamily: FONTS.primary,
  },
});
