import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

export const useWeeklyStats = (range: 'this_week' | 'last_week' | 'month' = 'this_week') => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['weekly_stats', user?.id, range],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      let daysCount = 7;
      let offset = 0;

      if (range === 'last_week') {
        offset = 7;
      } else if (range === 'month') {
        daysCount = 30;
      }

      const lastDays = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i + offset));
        d.setHours(0, 0, 0, 0);
        lastDays.push(d);
      }

      const startDate = lastDays[0];
      const endDate = new Date(lastDays[lastDays.length - 1]);
      endDate.setHours(23, 59, 59, 999);

      // Fetch meals with food items for the period
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select(`
          meal_at,
          food_items (calories)
        `)
        .eq('user_id', user.id)
        .gte('meal_at', startDate.toISOString())
        .lte('meal_at', endDate.toISOString())
        .eq('status', 'complete');

      if (mealError) throw mealError;

      // Map totals per day
      const dailyKcalMap: Record<string, number> = {};
      lastDays.forEach(day => {
        dailyKcalMap[day.toDateString()] = 0;
      });

      mealData?.forEach((meal: any) => {
        const dateStr = new Date(meal.meal_at).toDateString();
        if (dailyKcalMap[dateStr] !== undefined && Array.isArray(meal.food_items)) {
          // ✅ Optimización: reduce es más eficiente y semántico para sumar totales
          dailyKcalMap[dateStr] += meal.food_items.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);
        }
      });

      const dayLabels = lastDays.map((day, idx) => {
          if (range === 'month') {
              // For month, only show some labels
              return idx % 5 === 0 ? day.getDate().toString() : '';
          }
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[day.getDay()];
      });

      const kcalData = lastDays.map(day => Math.round(dailyKcalMap[day.toDateString()]));

      return {
        labels: dayLabels,
        data: kcalData,
        average: Math.round(kcalData.reduce((a, b) => a + b, 0) / (kcalData.filter(v => v > 0).length || 1)),
        daysActive: kcalData.filter(v => v > 0).length,
      };
    },
    enabled: !!user?.id,
  });
};
