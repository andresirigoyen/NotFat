import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

export const useDailyTotals = (date?: Date) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['daily_totals', user?.id, date?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!user?.id) return null;

      const queryDate = date || new Date();
      const today = new Date(queryDate);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 1. Fetch meals with food items
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select(`
          id,
          meal_at,
          food_items (
            calories,
            protein,
            carbs,
            fat
          )
        `)
        .eq('user_id', user.id)
        .gte('meal_at', today.toISOString())
        .lt('meal_at', tomorrow.toISOString())
        .eq('status', 'complete');

      if (mealError) throw mealError;

      // 2. Fetch water logs
      const { data: waterData, error: waterError } = await supabase
        .from('water_logs')
        .select('volume, unit')
        .eq('user_id', user.id)
        .gte('logged_at', today.toISOString())
        .lt('logged_at', tomorrow.toISOString());

      if (waterError) throw waterError;
      
      // 3. Fetch manual workouts
      const { data: workoutData, error: workoutError } = await supabase
        .from('manual_workouts')
        .select('estimated_calories')
        .eq('user_id', user.id)
        .gte('workout_date', today.toISOString().split('T')[0])
        .lte('workout_date', today.toISOString().split('T')[0]);

      if (workoutError) throw workoutError;

      const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0,
        burned: 0,
        mealCount: mealData?.length || 0,
      };

      mealData?.forEach((meal: any) => {
        meal.food_items?.forEach((item: any) => {
          totals.calories += item.calories || 0;
          totals.protein += item.protein || 0;
          totals.carbs += item.carbs || 0;
          totals.fat += item.fat || 0;
        });
      });

      waterData?.forEach((log: any) => {
        const volume = Number(log.volume) || 0;
        if (log.unit === 'oz') {
          totals.water += Math.round(volume * 29.5735);
        } else {
          totals.water += volume;
        }
      });

      workoutData?.forEach((workout: any) => {
        totals.burned += workout.estimated_calories || 0;
      });

      return {
        ...totals,
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
        water: Math.round(totals.water),
        burned: Math.round(totals.burned),
      };
    },
    enabled: !!user?.id,
  });
};
