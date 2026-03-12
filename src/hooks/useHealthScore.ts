import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/SupabaseContext';
import { useAuthStore } from '@/store';

interface HealthScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  insights: string[];
  recommendations: string[];
  strengths: string[];
  weaknesses: string[];
  generated_at: string;
  expires_at: string;
}

interface DailyNutritionData {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
  totalSodium: number;
  mealCount: number;
  vitamins?: {
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
    vitaminB6: number;
    vitaminB12: number;
    folate: number;
  };
  minerals?: {
    iron: number;
    calcium: number;
    potassium: number;
    magnesium: number;
    zinc: number;
  };
}

export function useHealthScore(date?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Obtener datos nutricionales del día
  const {
    data: nutritionData,
    isLoading: nutritionLoading,
  } = useQuery({
    queryKey: ['daily_nutrition', user?.id, targetDate],
    queryFn: async (): Promise<DailyNutritionData> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Obtener totales del día
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('id, total_calories, total_protein, total_carbs, total_fat, total_fiber, total_sugar, total_sodium')
        .eq('user_id', user.id)
        .eq('meal_date', targetDate)
        .eq('status', 'complete');

      if (mealsError) throw mealsError;

      // Obtener micronutrientes de food_items
      const { data: foodItems, error: foodError } = await supabase
        .from('food_items')
        .select(`
          calories,
          protein,
          carbs,
          fat,
          fiber,
          sugar,
          sodium
        `)
        .in('meal_id', meals?.map(m => m.id) || []);

      if (foodError) throw foodError;

      // Calcular totales
      const totals = meals?.reduce(
        (acc, meal) => ({
          totalCalories: acc.totalCalories + (meal.total_calories || 0),
          totalProtein: acc.totalProtein + (meal.total_protein || 0),
          totalCarbs: acc.totalCarbs + (meal.total_carbs || 0),
          totalFat: acc.totalFat + (meal.total_fat || 0),
          totalFiber: acc.totalFiber + (meal.total_fiber || 0),
          totalSugar: acc.totalSugar + (meal.total_sugar || 0),
          totalSodium: acc.totalSodium + (meal.total_sodium || 0),
          mealCount: acc.mealCount + 1,
        }),
        {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          totalSugar: 0,
          totalSodium: 0,
          mealCount: 0,
        }
      ) || {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        totalSugar: 0,
        totalSodium: 0,
        mealCount: 0,
      };

      return totals;
    },
    enabled: !!user?.id,
  });

  // Obtener health score existente
  const {
    data: existingScore,
    isLoading: scoreLoading,
  } = useQuery({
    queryKey: ['health_score', user?.id, targetDate],
    queryFn: async (): Promise<HealthScore | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('coach_insights')
        .select('*')
        .eq('user_id', user.id)
        .gte('generated_at', targetDate)
        .lt('generated_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()) // Hoy
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      if (data && data.insights) {
        const insights = data.insights as any;
        return {
          score: insights.score || 0,
          grade: insights.grade || 'C',
          insights: insights.insights || [],
          recommendations: insights.recommendations || [],
          strengths: insights.strengths || [],
          weaknesses: insights.weaknesses || [],
          generated_at: data.generated_at,
          expires_at: data.expires_at,
        };
      }

      return null;
    },
    enabled: !!user?.id && !!nutritionData,
  });

  // Generar nuevo health score
  const generateScoreMutation = useMutation({
    mutationFn: async (nutritionData: DailyNutritionData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('calculate-health-score', {
        body: {
          nutritionData,
          userId: user.id,
          date: targetDate,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health_score'] });
    },
  });

  // Calcular health score localmente (fallback)
  const calculateLocalScore = (data: DailyNutritionData): HealthScore => {
    let score = 50; // Base score
    const insights: string[] = [];
    const recommendations: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Evaluar calorías (basado en 2000 kcal)
    if (data.totalCalories >= 1800 && data.totalCalories <= 2200) {
      score += 10;
      strengths.push('Calorías adecuadas');
    } else if (data.totalCalories > 2200) {
      score -= 10;
      weaknesses.push('Exceso de calorías');
      recommendations.push('Reduce las calorías totales');
    } else {
      score -= 5;
      weaknesses.push('Calorías insuficientes');
      recommendations.push('Aumenta ligeramente las calorías');
    }

    // Evaluar proteína (basado en 50g mínimo)
    if (data.totalProtein >= 50) {
      score += 10;
      strengths.push('Buen consumo de proteína');
    } else {
      score -= 10;
      weaknesses.push('Proteína insuficiente');
      recommendations.push('Aumenta el consumo de proteína');
    }

    // Evaluar fibra (basado en 25g mínimo)
    if (data.totalFiber >= 25) {
      score += 10;
      strengths.push('Buen consumo de fibra');
    } else {
      score -= 10;
      weaknesses.push('Fibra insuficiente');
      recommendations.push('Aumenta el consumo de fibra');
    }

    // Evaluar azúcar (basado en 50g máximo)
    if (data.totalSugar <= 50) {
      score += 10;
      strengths.push('Control de azúcar');
    } else {
      score -= 10;
      weaknesses.push('Exceso de azúcar');
      recommendations.push('Reduce el consumo de azúcar');
    }

    // Evaluar balance de macros
    const proteinRatio = (data.totalProtein * 4) / data.totalCalories * 100;
    const carbRatio = (data.totalCarbs * 4) / data.totalCalories * 100;
    const fatRatio = (data.totalFat * 9) / data.totalCalories * 100;

    if (proteinRatio >= 15 && proteinRatio <= 35 &&
        carbRatio >= 45 && carbRatio <= 65 &&
        fatRatio >= 20 && fatRatio <= 35) {
      score += 10;
      strengths.push('Buen balance de macronutrientes');
    } else {
      score -= 5;
      weaknesses.push('Balance de macros desajustado');
      recommendations.push('Ajusta el balance de macronutrientes');
    }

    // Evaluar número de comidas
    if (data.mealCount >= 3 && data.mealCount <= 5) {
      score += 5;
      strengths.push('Buen número de comidas');
    } else if (data.mealCount < 3) {
      score -= 5;
      weaknesses.push('Pocas comidas durante el día');
      recommendations.push('Considera hacer más comidas pequeñas');
    }

    // Determinar calificación
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    // Agregar insights generales
    if (data.totalCalories > 0) {
      insights.push(`Consumiste ${data.totalCalories} calorías en ${data.mealCount} comidas`);
    }
    if (strengths.length > 0) {
      insights.push('Tienes varios aspectos positivos en tu nutrición');
    }
    if (weaknesses.length > 0) {
      insights.push('Hay áreas que puedes mejorar');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      grade,
      insights,
      recommendations,
      strengths,
      weaknesses,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
    };
  };

  // Generar score si no existe o está expirado
  const generateScore = async () => {
    if (!nutritionData) return;

    try {
      await generateScoreMutation.mutateAsync(nutritionData);
    } catch (error) {
      console.error('Error generating health score:', error);
      // Fallback a cálculo local
      const localScore = calculateLocalScore(nutritionData);
      queryClient.setQueryData(['health_score', user?.id, targetDate], localScore);
    }
  };

  const healthScore = existingScore || 
    (nutritionData ? calculateLocalScore(nutritionData) : null);

  return {
    healthScore,
    nutritionData,
    isLoading: nutritionLoading || scoreLoading,
    isGenerating: generateScoreMutation.isPending,
    generateScore,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['health_score'] }),
  };
}
