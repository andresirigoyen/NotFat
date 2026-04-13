import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import { 
  calculateAge, 
  calculateMifflinStJeor, 
  getActivityLevelInfo 
} from '@/utils/nutrition';

interface UserProfile {
  height_value?: number;
  weight_value?: number;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  activity_level?: number;
}

interface ActivityProfile {
  does_sport?: boolean;
  daily_activity_level?: string;
  activity_system_version?: string;
}

export interface ScientificGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
  bmr: number;
  tdee: number;
  calculations: {
    age: number;
    bmr_formula: string;
    activity_multiplier: number;
    activity_name?: string;
    protein_formula: string;
    carb_formula: string;
    fat_formula: string;
    goal_type?: string;
  };
}

interface NutritionGoalsData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  water?: number;
}

export function useScientificGoals() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Calcular objetivos científicos
  const calculateGoalsMutation = useMutation({
    mutationFn: async (): Promise<ScientificGoals> => {
      if (!user?.id) throw new Error('User not authenticated');

      // 1. Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('height_value, weight_value, birth_date, gender, activity_level, nutrition_goal')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error('Perfil del usuario no encontrado');
      }

      // 2. Obtener perfil de actividad
      const { data: activityProfile, error: activityError } = await supabase
        .from('user_activity_profile')
        .select('does_sport, daily_activity_level')
        .eq('user_id', user.id)
        .maybeSingle();

      // 3. Calcular edad
      const age = calculateAge(profile.birth_date!);
      
      // 4. Determinar nivel de actividad
      const activityLevel = getActivityLevelInfo(
        activityProfile?.daily_activity_level,
        profile.activity_level
      );

      // 5. Calcular BMR usando Mifflin-St Jeor (más precisa que Harris-Benedict)
      const bmr = calculateMifflinStJeor(
        profile.weight_value!,
        profile.height_value!,
        age,
        profile.gender || 'other'
      );

      // 6. Calcular TDEE (Total Daily Energy Expenditure / Mantenimiento)
      const tdee = bmr * activityLevel.multiplier;

      // 6.5 Ajustar por objetivo
      let targetCalories = tdee;
      const goal = profile.nutrition_goal || 'maintain';
      if (goal === 'lose_weight') {
        targetCalories -= 500;
      } else if (goal === 'gain_weight') {
        targetCalories += 300;
      }
      
      // Mínimos de seguridad
      const minCalories = profile.gender === 'female' ? 1200 : 1500;
      targetCalories = Math.max(targetCalories, minCalories);

      // 7. Calcular macronutrientes basados en objetivo calórico y peso
      const { protein, carbs, fat } = calculateMacronutrients(
        profile.weight_value!,
        targetCalories,
        activityProfile?.does_sport || false
      );

      // 8. Calcular fibra y agua
      const fiber = calculateFiberGoal(profile.weight_value!);
      const water = calculateWaterGoal(profile.weight_value!);

      const goals: ScientificGoals = {
        calories: Math.round(targetCalories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        fiber: Math.round(fiber),
        water: Math.round(water),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        calculations: {
          age,
          bmr_formula: 'Mifflin-St Jeor',
          activity_multiplier: activityLevel.multiplier,
          protein_formula: activityProfile?.does_sport ? 'Deportista (1.8g/kg)' : 'Estándar (0.8g/kg)',
          carb_formula: goal === 'lose_weight' ? 'Déficit moderado' : goal === 'gain_weight' ? 'Superávit leve' : 'Mantenimiento',
          fat_formula: '25% de ingesta total',
        },
      };

      return goals;
    },
  });

  // Guardar objetivos en nutrition_goals
  const saveGoalsMutation = useMutation({
    mutationFn: async (goals: ScientificGoals) => {
      if (!user?.id) throw new Error('User not authenticated');

      const goalsData = {
        user_id: user.id,
        calories: goals.calories,
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat,
        fiber: goals.fiber,
        water: goals.water,
        bmr: goals.bmr,
        tdee: goals.tdee,
        source: 'algorithm',
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
      };

      // 1. Desactivar objetivos anteriores (Nutrición)
      await supabase
        .from('nutrition_goals')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // 2. Insertar nuevos objetivos de nutrición
      const { data, error } = await supabase
        .from('nutrition_goals')
        .insert(goalsData)
        .select()
        .maybeSingle();
      
      if (error) {
        console.error('Save Nutrition Goals Error:', error);
        throw error;
      }

      // 3. Sincronizar con Hydration Goals
      await supabase
        .from('hydration_goals')
        .upsert({
          user_id: user.id,
          daily_goal: goals.water,
          unit: 'ml',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_goals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['hydration_goals', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals'] });
    },
  });

  // Calcular macronutrientes
  const calculateMacronutrients = (weight: number, tdee: number, doesSport: boolean) => {
    // Proteína: basada en peso y actividad física
    let protein: number;
    if (doesSport) {
      protein = weight * 1.8; // 1.6-2.2g/kg para personas activas
    } else {
      protein = weight * 0.8; // 0.8-1.2g/kg para sedentarios
    }

    // Grasa: 20-35% de calorías totales
    const fatCalories = tdee * 0.25; // 25% promedio
    const fat = fatCalories / 9; // 9 calorías por gramo de grasa

    // Carbohidratos: el resto de las calorías
    const proteinCalories = protein * 4;
    const remainingCalories = tdee - proteinCalories - fatCalories;
    const carbs = Math.max(0, remainingCalories / 4); // Prevención de números negativos

    return { protein, carbs, fat };
  };

  // Calcular objetivo de fibra
  const calculateFiberGoal = (weight: number): number => {
    // 25-35g por día, o 14g por cada 1000 calorías
    return Math.max(25, weight * 0.3); // Simplificado: 0.3g por kg de peso
  };

  // Calcular objetivo de agua
  const calculateWaterGoal = (weight: number): number => {
    // 30-35ml por kg de peso corporal
    return weight * 35; // 35ml por kg
  };

  // Función principal para generar y guardar objetivos
  const generateAndSaveGoals = useCallback(async () => {
    try {
      const goals = await calculateGoalsMutation.mutateAsync();
      await saveGoalsMutation.mutateAsync(goals);
      
      Alert.alert(
        'Éxito',
        'Objetivos científicos calculados y guardados correctamente',
        [
          { text: 'OK', style: 'default' }
        ]
      );

      return goals;
    } catch (error) {
      console.error('Error generating scientific goals:', error);
      Alert.alert(
        'Error',
        'No se pudieron calcular los objetivos científicos',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      throw error;
    }
  }, [calculateGoalsMutation, saveGoalsMutation]);

  return {
    generateAndSaveGoals,
    calculateGoals: calculateGoalsMutation.mutateAsync,
    saveGoals: saveGoalsMutation.mutateAsync,
    isLoading: calculateGoalsMutation.isPending || saveGoalsMutation.isPending,
  };
}
