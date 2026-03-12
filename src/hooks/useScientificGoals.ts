import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/SupabaseContext';
import { useAuthStore } from '@/store';

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

interface ScientificGoals {
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
    protein_formula: string;
    carb_formula: string;
    fat_formula: string;
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
        .select('height_value, weight_value, birth_date, gender, activity_level')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil del usuario no encontrado');
      }

      // 2. Obtener perfil de actividad
      const { data: activityProfile, error: activityError } = await supabase
        .from('user_activity_profile')
        .select('does_sport, daily_activity_level')
        .eq('user_id', user.id)
        .single();

      // 3. Calcular edad
      const age = calculateAge(profile.birth_date!);
      
      // 4. Determinar nivel de actividad
      const activityLevel = determineActivityLevel(
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

      // 6. Calcular TDEE (Total Daily Energy Expenditure)
      const tdee = bmr * activityLevel.multiplier;

      // 7. Calcular macronutrientes basados en objetivos y peso
      const { protein, carbs, fat } = calculateMacronutrients(
        profile.weight_value!,
        tdee,
        activityProfile?.does_sport || false
      );

      // 8. Calcular fibra y agua
      const fiber = calculateFiberGoal(profile.weight_value!);
      const water = calculateWaterGoal(profile.weight_value!);

      const goals: ScientificGoals = {
        calories: Math.round(tdee),
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
          protein_formula: activityProfile?.does_sport ? '1.6-2.2g/kg peso' : '0.8-1.2g/kg peso',
          carb_formula: '45-65% de calorías totales',
          fat_formula: '20-35% de calorías totales',
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
        source: 'algorithm',
        start_date: new Date().toISOString().split('T')[0],
      };

      // Primero, desactivar objetivos anteriores
      await supabase
        .from('nutrition_goals')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Insertar nuevos objetivos
      const { data, error } = await supabase
        .from('nutrition_goals')
        .insert(goalsData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_goals'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Función para calcular edad
  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Determinar nivel de actividad
  const determineActivityLevel = (dailyLevel?: string, profileLevel?: number) => {
    // Priorizar el nivel de actividad del perfil
    if (profileLevel) {
      if (profileLevel <= 1.2) return { name: 'Sedentario', multiplier: 1.2 };
      if (profileLevel <= 1.375) return { name: 'Ligeramente activo', multiplier: 1.375 };
      if (profileLevel <= 1.55) return { name: 'Moderadamente activo', multiplier: 1.55 };
      if (profileLevel <= 1.725) return { name: 'Muy activo', multiplier: 1.725 };
      return { name: 'Extremadamente activo', multiplier: 1.9 };
    }

    // Fallback a daily_activity_level
    switch (dailyLevel?.toLowerCase()) {
      case 'sedentary':
        return { name: 'Sedentario', multiplier: 1.2 };
      case 'lightly_active':
        return { name: 'Ligeramente activo', multiplier: 1.375 };
      case 'moderately_active':
        return { name: 'Moderadamente activo', multiplier: 1.55 };
      case 'very_active':
        return { name: 'Muy activo', multiplier: 1.725 };
      case 'extra_active':
        return { name: 'Extremadamente activo', multiplier: 1.9 };
      default:
        return { name: 'Moderadamente activo', multiplier: 1.55 }; // Default
    }
  };

  // Calcular BMR usando Mifflin-St Jeor
  const calculateMifflinStJeor = (weight: number, height: number, age: number, gender: string): number => {
    if (gender === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

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
    const carbs = remainingCalories / 4; // 4 calorías por gramo de carbohidrato

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
