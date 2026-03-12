import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

export const useWeeklyStats = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['weekly_stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get last 7 days including today
      const now = new Date();
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        last7Days.push(d);
      }

      const startDate = last7Days[0];
      const endDate = new Date(now);
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
      last7Days.forEach(day => {
        dailyKcalMap[day.toDateString()] = 0;
      });

      mealData?.forEach((meal: any) => {
        const dateStr = new Date(meal.meal_at).toDateString();
        if (dailyKcalMap[dateStr] !== undefined) {
          meal.food_items?.forEach((item: any) => {
            dailyKcalMap[dateStr] += item.calories || 0;
          });
        }
      });

      const dayLabels = last7Days.map(day => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[day.getDay()];
      });

      const kcalData = last7Days.map(day => Math.round(dailyKcalMap[day.toDateString()]));

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
