import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface NutritionAnalytics {
  avg_daily_calories: number;
  avg_daily_protein: number;
  avg_daily_carbs: number;
  avg_daily_fat: number;
  calorie_goal_adherence: number;
  macro_distribution: {
    protein_percentage: number;
    carbs_percentage: number;
    fat_percentage: number;
  };
  meal_frequency: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
  nutrition_score_trend: number[];
  top_food_categories: Array<{
    category: string;
    count: number;
    avg_calories: number;
  }>;
}

interface FitnessAnalytics {
  avg_daily_steps: number;
  avg_workout_minutes: number;
  workout_frequency: number;
  active_calories_burned: number;
  resting_heart_rate?: number;
  vo2_max?: number;
  fitness_score_trend: number[];
  workout_type_distribution: Record<string, number>;
  performance_metrics: {
    strength_progress: number;
    endurance_progress: number;
    flexibility_progress: number;
  };
}

interface HealthAnalytics {
  avg_sleep_hours: number;
  avg_sleep_quality: number;
  sleep_consistency: number;
  hydration_adherence: number;
  stress_level_trend: number[];
  body_composition_changes: {
    weight_change: number;
    body_fat_change: number;
    muscle_mass_change: number;
  };
  health_score: number;
  risk_factors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

interface BehavioralAnalytics {
  app_usage_patterns: {
    most_active_day: string;
    most_active_time: string;
    session_duration_avg: number;
    feature_usage: Record<string, number>;
  };
  habit_formation: {
    consistent_habits: string[];
    developing_habits: string[];
    abandoned_habits: string[];
  };
  motivation_patterns: {
    peak_motivation_times: string[];
    demotivation_triggers: string[];
    success_factors: string[];
  };
  engagement_metrics: {
    streak_days: number;
    completion_rate: number;
    retention_rate: number;
    social_engagement: number;
  };
}

interface PredictiveAnalytics {
  goal_achievement_probability: {
    weight_goal: number;
    fitness_goal: number;
    nutrition_goal: number;
    habit_goal: number;
  };
  risk_predictions: {
    injury_risk: number;
    burnout_risk: number;
    attrition_risk: number;
  };
  recommendations: Array<{
    type: 'nutrition' | 'fitness' | 'lifestyle' | 'mental_health';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    expected_impact: number;
    implementation_effort: 'low' | 'medium' | 'high';
  }>;
  trend_forecasts: {
    weight_projection: Array<{ date: string; predicted_weight: number }>;
    fitness_projection: Array<{ date: string; predicted_fitness_score: number }>;
    health_projection: Array<{ date: string; predicted_health_score: number }>;
  };
}

export const useNutritionAnalytics = (userId: string, startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['nutrition_analytics', userId, startDate, endDate],
    queryFn: async () => {
      const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEndDate = endDate || new Date();

      // Get meals data
      const { data: meals } = await supabase
        .from('meals')
        .select(`
          meal_at,
          meal_type,
          food_items(
            calories,
            protein,
            carbs,
            fat,
            name,
            categories
          )
        `)
        .eq('user_id', userId)
        .gte('meal_at', defaultStartDate.toISOString())
        .lte('meal_at', defaultEndDate.toISOString())
        .eq('status', 'complete');

      // Get nutrition goals
      const { data: nutritionGoals } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const nutritionGoal = nutritionGoals?.[0] || null;

      if (!meals || meals.length === 0) {
        return {
          avg_daily_calories: 0,
          avg_daily_protein: 0,
          avg_daily_carbs: 0,
          avg_daily_fat: 0,
          calorie_goal_adherence: 0,
          macro_distribution: { protein_percentage: 0, carbs_percentage: 0, fat_percentage: 0 },
          meal_frequency: { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 },
          nutrition_score_trend: [],
          top_food_categories: [],
        };
      }

      // Calculate daily totals
      const dailyTotals: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
      const mealFrequency = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
      const foodCategories: Record<string, { count: number; totalCalories: number }> = {};

      meals.forEach(meal => {
        const date = meal.meal_at.split('T')[0];
        
        if (!dailyTotals[date]) {
          dailyTotals[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        meal.food_items?.forEach(item => {
          dailyTotals[date].calories += item.calories || 0;
          dailyTotals[date].protein += item.protein || 0;
          dailyTotals[date].carbs += item.carbs || 0;
          dailyTotals[date].fat += item.fat || 0;

          // Track meal frequency
          if (meal.meal_type === 'breakfast') mealFrequency.breakfast++;
          else if (meal.meal_type === 'lunch') mealFrequency.lunch++;
          else if (meal.meal_type === 'dinner') mealFrequency.dinner++;
          else if (meal.meal_type === 'snack') mealFrequency.snacks++;

          // Track food categories
          const categories: string[] = item.categories || ['other'];
          categories.forEach((category: string) => {
            if (!foodCategories[category]) {
              foodCategories[category] = { count: 0, totalCalories: 0 };
            }
            foodCategories[category].count++;
            foodCategories[category].totalCalories += item.calories || 0;
          });
        });
      });

      // Calculate averages
      const days = Object.keys(dailyTotals).length;
      const totalCalories = Object.values(dailyTotals).reduce((sum, day) => sum + day.calories, 0);
      const totalProtein = Object.values(dailyTotals).reduce((sum, day) => sum + day.protein, 0);
      const totalCarbs = Object.values(dailyTotals).reduce((sum, day) => sum + day.carbs, 0);
      const totalFat = Object.values(dailyTotals).reduce((sum, day) => sum + day.fat, 0);

      const avgDailyCalories = totalCalories / days;
      const avgDailyProtein = totalProtein / days;
      const avgDailyCarbs = totalCarbs / days;
      const avgDailyFat = totalFat / days;

      // Calculate macro distribution
      const totalMacroCalories = (avgDailyProtein * 4) + (avgDailyCarbs * 4) + (avgDailyFat * 9);
      const macroDistribution = {
        protein_percentage: totalMacroCalories > 0 ? (avgDailyProtein * 4) / totalMacroCalories * 100 : 0,
        carbs_percentage: totalMacroCalories > 0 ? (avgDailyCarbs * 4) / totalMacroCalories * 100 : 0,
        fat_percentage: totalMacroCalories > 0 ? (avgDailyFat * 9) / totalMacroCalories * 100 : 0,
      };

      // Calculate goal adherence
      const calorieGoalAdherence = nutritionGoal?.calories ? 
        Math.min(100, (avgDailyCalories / nutritionGoal.calories) * 100) : 0;

      // Get top food categories
      const topFoodCategories = Object.entries(foodCategories)
        .map(([category, data]) => ({
          category,
          count: data.count,
          avg_calories: data.totalCalories / data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Generate nutrition score trend
      const nutritionScoreTrend = Object.entries(dailyTotals)
        .map(([date, totals]) => {
          let score = 50; // Base score
          
          // Calorie adherence
          if (nutritionGoal?.calories) {
            const adherence = Math.abs(totals.calories - nutritionGoal.calories) / nutritionGoal.calories;
            score += Math.max(-20, 20 - adherence * 40);
          }

          // Macro balance (ideal: 30% protein, 40% carbs, 30% fat)
          const macroCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fat * 9);
          if (macroCalories > 0) {
            const proteinPct = (totals.protein * 4) / macroCalories * 100;
            const carbsPct = (totals.carbs * 4) / macroCalories * 100;
            const fatPct = (totals.fat * 9) / macroCalories * 100;

            const proteinScore = Math.max(-10, 10 - Math.abs(proteinPct - 30) / 2);
            const carbsScore = Math.max(-10, 10 - Math.abs(carbsPct - 40) / 2);
            const fatScore = Math.max(-10, 10 - Math.abs(fatPct - 30) / 2);

            score += proteinScore + carbsScore + fatScore;
          }

          return Math.round(Math.max(0, Math.min(100, score)));
        })
        .slice(-30);

      return {
        avg_daily_calories: Math.round(avgDailyCalories),
        avg_daily_protein: Math.round(avgDailyProtein),
        avg_daily_carbs: Math.round(avgDailyCarbs),
        avg_daily_fat: Math.round(avgDailyFat),
        calorie_goal_adherence: Math.round(calorieGoalAdherence),
        macro_distribution: {
          protein_percentage: Math.round(macroDistribution.protein_percentage),
          carbs_percentage: Math.round(macroDistribution.carbs_percentage),
          fat_percentage: Math.round(macroDistribution.fat_percentage),
        },
        meal_frequency: mealFrequency,
        nutrition_score_trend: nutritionScoreTrend,
        top_food_categories: topFoodCategories,
      };
    },
    enabled: !!userId,
  });
};

export const useFitnessAnalytics = (userId: string, startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['fitness_analytics', userId, startDate, endDate],
    queryFn: async () => {
      const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEndDate = endDate || new Date();

      // Get health data
      const { data: healthData } = await supabase
        .from('health_daily_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('date', defaultStartDate.toISOString().split('T')[0])
        .lte('date', defaultEndDate.toISOString().split('T')[0]);

      // Get workout sessions
      const { data: workoutSessions } = await supabase
        .from('manual_workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('workout_date', defaultStartDate.toISOString().split('T')[0])
        .lte('workout_date', defaultEndDate.toISOString().split('T')[0]);

      if (!healthData || healthData.length === 0) {
        return {
          avg_daily_steps: 0,
          avg_workout_minutes: 0,
          workout_frequency: 0,
          active_calories_burned: 0,
          fitness_score_trend: [],
          workout_type_distribution: {},
          performance_metrics: {
            strength_progress: 0,
            endurance_progress: 0,
            flexibility_progress: 0,
          },
        };
      }

      // Calculate fitness metrics
      const avgDailySteps = healthData.reduce((sum, day) => sum + (day.steps || 0), 0) / healthData.length;
      const avgWorkoutMinutes = healthData.reduce((sum, day) => sum + (day.workout_minutes || 0), 0) / healthData.length;
      const workoutFrequency = healthData.filter(day => (day.workout_count || 0) > 0).length / healthData.length;
      const activeCaloriesBurned = healthData.reduce((sum, day) => sum + (day.active_calories_burned || 0), 0) / healthData.length;

      // Workout type distribution
      const workoutTypeDistribution: Record<string, number> = {};
      workoutSessions?.forEach(session => {
        workoutTypeDistribution[session.sport_type] = (workoutTypeDistribution[session.sport_type] || 0) + 1;
      });

      // Generate fitness score trend
      const fitnessScoreTrend = healthData.map(day => {
        let score = 50; // Base score

        // Steps score (goal: 10,000 steps)
        const stepsScore = Math.min(30, (day.steps || 0) / 10000 * 30);
        score += stepsScore;

        // Workout score
        const workoutScore = Math.min(20, (day.workout_minutes || 0) / 30 * 20);
        score += workoutScore;

        return Math.round(Math.max(0, Math.min(100, score)));
      });

      return {
        avg_daily_steps: Math.round(avgDailySteps),
        avg_workout_minutes: Math.round(avgWorkoutMinutes),
        workout_frequency: Math.round(workoutFrequency * 100),
        active_calories_burned: Math.round(activeCaloriesBurned),
        fitness_score_trend: fitnessScoreTrend,
        workout_type_distribution: workoutTypeDistribution,
        performance_metrics: {
          strength_progress: 75, // Placeholder - would need historical data
          endurance_progress: 80,
          flexibility_progress: 65,
        },
      };
    },
    enabled: !!userId,
  });
};

export const useHealthAnalytics = (userId: string, startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['health_analytics', userId, startDate, endDate],
    queryFn: async () => {
      const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEndDate = endDate || new Date();

      // Get health data
      const { data: healthData } = await supabase
        .from('health_daily_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('date', defaultStartDate.toISOString().split('T')[0])
        .lte('date', defaultEndDate.toISOString().split('T')[0]);

      // Get body metrics
      const { data: bodyMetrics } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('measured_at', defaultStartDate.toISOString())
        .lte('measured_at', defaultEndDate.toISOString())
        .order('measured_at', { ascending: true });

      // Get water logs
      const { data: waterLogs } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', defaultStartDate.toISOString())
        .lte('logged_at', defaultEndDate.toISOString());

      if (!healthData || healthData.length === 0) {
        return {
          avg_sleep_hours: 0,
          avg_sleep_quality: 0,
          sleep_consistency: 0,
          hydration_adherence: 0,
          stress_level_trend: [],
          body_composition_changes: {
            weight_change: 0,
            body_fat_change: 0,
            muscle_mass_change: 0,
          },
          health_score: 0,
          risk_factors: [],
        };
      }

      // Calculate health metrics
      const avgSleepHours = healthData.reduce((sum, day) => sum + (day.sleep_hours || 0), 0) / healthData.length;
      const avgSleepQuality = healthData.reduce((sum, day) => sum + (day.sleep_quality || 0), 0) / healthData.length;

      // Sleep consistency (standard deviation)
      const sleepHours = healthData.map(day => day.sleep_hours || 0);
      const meanSleep = sleepHours.reduce((sum, val) => sum + val, 0) / sleepHours.length;
      const sleepVariance = sleepHours.reduce((sum, val) => sum + Math.pow(val - meanSleep, 2), 0) / sleepHours.length;
      const sleepConsistency = Math.max(0, 100 - Math.sqrt(sleepVariance) * 10);

      // Hydration adherence
      const totalWaterIntake = waterLogs?.reduce((sum, log) => sum + log.volume, 0) || 0;
      const daysWithWater = new Set(waterLogs?.map(log => log.logged_at.split('T')[0])).size;
      const avgDailyWater = daysWithWater > 0 ? totalWaterIntake / daysWithWater : 0;
      const hydrationGoal = 2000; // Default 2L goal
      const hydrationAdherence = Math.min(100, (avgDailyWater / hydrationGoal) * 100);

      // Body composition changes
      const bodyCompositionChanges = {
        weight_change: 0,
        body_fat_change: 0,
        muscle_mass_change: 0,
      };

      if (bodyMetrics && bodyMetrics.length >= 2) {
        const firstMetric = bodyMetrics[0];
        const lastMetric = bodyMetrics[bodyMetrics.length - 1];

        bodyCompositionChanges.weight_change = (lastMetric.weight_value || 0) - (firstMetric.weight_value || 0);
        bodyCompositionChanges.body_fat_change = (lastMetric.body_fat_value || 0) - (firstMetric.body_fat_value || 0);
      }

      // Calculate overall health score
      const sleepScore = Math.min(30, avgSleepQuality);
      const hydrationScore = Math.min(20, hydrationAdherence / 5);
      const consistencyScore = Math.min(20, sleepConsistency / 5);
      const bodyCompositionScore = Math.max(-30, Math.min(30, -bodyCompositionChanges.weight_change * 2));

      const healthScore = Math.round(Math.max(0, Math.min(100, 50 + sleepScore + hydrationScore + consistencyScore + bodyCompositionScore)));

      // Generate risk factors
      const riskFactors = [];

      if (avgSleepHours < 6) {
        riskFactors.push({
          factor: 'sleep_deprivation',
          level: 'high' as const,
          description: 'Less than 6 hours of sleep per night may impact recovery and performance',
        });
      } else if (avgSleepHours < 7) {
        riskFactors.push({
          factor: 'insufficient_sleep',
          level: 'medium' as const,
          description: 'Less than 7 hours of sleep may affect long-term health',
        });
      }

      if (hydrationAdherence < 50) {
        riskFactors.push({
          factor: 'dehydration',
          level: 'high' as const,
          description: 'Low hydration may impact performance and recovery',
        });
      }

      if (sleepConsistency < 50) {
        riskFactors.push({
          factor: 'irregular_sleep',
          level: 'medium' as const,
          description: 'Irregular sleep patterns may affect circadian rhythm',
        });
      }

      return {
        avg_sleep_hours: Math.round(avgSleepHours * 10) / 10,
        avg_sleep_quality: Math.round(avgSleepQuality),
        sleep_consistency: Math.round(sleepConsistency),
        hydration_adherence: Math.round(hydrationAdherence),
        stress_level_trend: [], // Would need stress data
        body_composition_changes: bodyCompositionChanges,
        health_score: healthScore,
        risk_factors: riskFactors,
      };
    },
    enabled: !!userId,
  });
};

export const useBehavioralAnalytics = (userId: string) => {
  return useQuery({
    queryKey: ['behavioral_analytics', userId],
    queryFn: async () => {
      // This would require tracking user interactions, app sessions, etc.
      // For now, return mock data structure
      
      return {
        app_usage_patterns: {
          most_active_day: 'Monday',
          most_active_time: '19:00',
          session_duration_avg: 15,
          feature_usage: {
            meal_logging: 45,
            water_tracking: 20,
            progress_viewing: 15,
            social_features: 10,
            workout_logging: 10,
          },
        },
        habit_formation: {
          consistent_habits: ['meal_logging', 'water_intake'],
          developing_habits: ['workout_tracking'],
          abandoned_habits: [],
        },
        motivation_patterns: {
          peak_motivation_times: ['08:00', '19:00'],
          demotivation_triggers: ['weekend', 'stress'],
          success_factors: ['social_support', 'goal_visibility'],
        },
        engagement_metrics: {
          streak_days: 12,
          completion_rate: 78,
          retention_rate: 85,
          social_engagement: 25,
        },
      };
    },
    enabled: !!userId,
  });
};

export const usePredictiveAnalytics = (userId: string) => {
  return useQuery({
    queryKey: ['predictive_analytics', userId],
    queryFn: async () => {
      // ✅ FIX #7: Eliminadas las llamadas a hooks dentro de queryFn (violación de Regla de Hooks).
      // Ahora se obtienen los datos directamente de Supabase sin llamar a otros hooks.
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [mealsResult, healthResult, waterResult, goalsResult] = await Promise.all([
        supabase
          .from('meals')
          .select('meal_at, meal_type, food_items(calories, protein, carbs, fat)')
          .eq('user_id', userId)
          .gte('meal_at', thirtyDaysAgo.toISOString())
          .eq('status', 'complete'),
        supabase
          .from('health_daily_snapshots')
          .select('date, steps, workout_minutes, sleep_hours, sleep_quality')
          .eq('user_id', userId)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
        supabase
          .from('water_logs')
          .select('logged_at, volume')
          .eq('user_id', userId)
          .gte('logged_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('nutrition_goals')
          .select('calories, protein, carbs, fat')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      // ✅ FIX #3: supabase.functions.invoke() con auth automática
      const { data: predictions, error: fnError } = await supabase.functions.invoke('predictive-analytics', {
        body: {
          userId,
          meals: mealsResult.data || [],
          healthSnapshots: healthResult.data || [],
          waterLogs: waterResult.data || [],
          goals: goalsResult.data?.[0] || null,
        },
      });

      if (fnError) throw fnError;
      return predictions as PredictiveAnalytics;
    },
    enabled: !!userId,
  });
};

export const useComprehensiveAnalytics = (userId: string, startDate?: Date, endDate?: Date) => {
  const nutritionQuery = useNutritionAnalytics(userId, startDate, endDate);
  const fitnessQuery = useFitnessAnalytics(userId, startDate, endDate);
  const healthQuery = useHealthAnalytics(userId, startDate, endDate);
  const behavioralQuery = useBehavioralAnalytics(userId);
  const predictiveQuery = usePredictiveAnalytics(userId);

  return {
    nutrition: nutritionQuery.data,
    fitness: fitnessQuery.data,
    health: healthQuery.data,
    behavioral: behavioralQuery.data,
    predictive: predictiveQuery.data,
    isLoading: nutritionQuery.isLoading || fitnessQuery.isLoading || healthQuery.isLoading || 
              behavioralQuery.isLoading || predictiveQuery.isLoading,
    error: nutritionQuery.error || fitnessQuery.error || healthQuery.error || 
           behavioralQuery.error || predictiveQuery.error,
  };
};

export const useGenerateAnalyticsReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      reportType, 
      startDate, 
      endDate 
    }: { 
      userId: string; 
      reportType: 'weekly' | 'monthly' | 'quarterly';
      startDate: Date;
      endDate: Date;
    }) => {
      // ✅ FIX #3: supabase.functions.invoke() con auth automática
      const { data: report, error: fnError } = await supabase.functions.invoke('generate-analytics-report', {
        body: {
          userId,
          reportType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      if (fnError) throw fnError;
      if (!report) throw new Error('Failed to generate analytics report');

      // Save report to database
      const { data, error } = await supabase
        .from('analytics_reports')
        .insert({
          user_id: userId,
          report_type: reportType,
          report_data: report,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          generated_at: new Date().toISOString(),
        })
        .select()
        .limit(1);

      if (error) throw error;

      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics_reports'] });
    },
  });
};
