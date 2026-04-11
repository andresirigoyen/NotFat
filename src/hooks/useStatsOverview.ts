import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

type RangeDays = 7 | 30 | 90;

export interface StatsOverview {
  labels: string[];
  weightData: number[];
  caloriesData: number[];
  hydrationData: number[];
  macrosData: Array<{
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }>;
  summary: {
    avgCalories: number;
    totalCalories: number;
    totalWater: number;
    currentWeight: number;
    weightChange: number;
    daysActive: number;
    totalMeals: number;
  };
}

const DAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const formatShortLabel = (date: Date, range: RangeDays) => {
  if (range === 7) {
    return DAY_LABELS_ES[date.getDay()];
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const useStatsOverview = (range: RangeDays) => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['stats_overview', user?.id, range],
    enabled: !!user?.id,
    queryFn: async (): Promise<StatsOverview> => {
      if (!user?.id) {
        return {
          labels: [],
          weightData: [],
          caloriesData: [],
          hydrationData: [],
          macrosData: [],
          summary: {
            avgCalories: 0,
            totalCalories: 0,
            totalWater: 0,
            currentWeight: 0,
            weightChange: 0,
            daysActive: 0,
            totalMeals: 0,
          },
        };
      }

      const endDate = startOfDay(new Date());
      const startDate = startOfDay(new Date());
      startDate.setDate(startDate.getDate() - (range - 1));
      const tomorrow = new Date(endDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [mealsRes, waterRes, bodyMetricsRes] = await Promise.all([
        supabase
          .from('meals')
          .select('id, meal_date, total_calories, total_protein, total_carbs, total_fat')
          .eq('user_id', user.id)
          .gte('meal_date', startDate.toISOString().split('T')[0])
          .lte('meal_date', tomorrow.toISOString().split('T')[0])
          .eq('status', 'complete'),
        supabase
          .from('water_logs')
          .select('logged_at, volume')
          .eq('user_id', user.id)
          .gte('logged_at', startDate.toISOString())
          .lt('logged_at', tomorrow.toISOString()),
        supabase
          .from('body_metrics')
          .select('measured_at, weight_value')
          .eq('user_id', user.id)
          .gte('measured_at', startDate.toISOString())
          .lt('measured_at', tomorrow.toISOString())
          .order('measured_at', { ascending: true }),
      ]);

      if (mealsRes.error) throw mealsRes.error;
      if (waterRes.error) throw waterRes.error;
      if (bodyMetricsRes.error) throw bodyMetricsRes.error;

      const meals = mealsRes.data ?? [];
      const waterLogs = waterRes.data ?? [];
      const bodyMetrics = bodyMetricsRes.data ?? [];

      // If we need detailed food items for more accurate macro distribution, fetch them separately
      const mealIds = meals.map(m => m.id);
      let foodItems: any[] = [];
      if (mealIds.length > 0) {
        const { data: foodRes, error: foodErr } = await supabase
          .from('food_items')
          .select('meal_id, calories, protein, carbs, fat')
          .in('meal_id', mealIds);
        
        if (!foodErr) foodItems = foodRes ?? [];
      }


      const days: Date[] = [];
      for (let i = 0; i < range; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
      }

      const dailyTotals = days.map((day) => ({
        date: day,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0,
        mealCount: 0,
      }));

      const dayKey = (date: Date) => date.toISOString().split('T')[0];
      const dailyMap = new Map<string, typeof dailyTotals[number]>(
        dailyTotals.map((item) => [dayKey(item.date), item]),
      );

      meals.forEach((meal: any) => {
        // meal_date is usually 'YYYY-MM-DD' and dayKey results in that same format
        const mealDayKey = meal.meal_date;
        const bucket = dailyMap.get(mealDayKey);
        if (!bucket) return;

        bucket.mealCount += 1;
        
        // Use pre-aggregated meal metrics as baseline if available, or sum food items
        const itemsForThisMeal = foodItems.filter(fi => fi.meal_id === meal.id);
        
        if (itemsForThisMeal.length > 0) {
          itemsForThisMeal.forEach((item: any) => {
            bucket.calories += item.calories || 0;
            bucket.protein += item.protein || 0;
            bucket.carbs += item.carbs || 0;
            bucket.fat += item.fat || 0;
          });
        } else {
          // Fallback to meal-level metrics if items not found
          bucket.calories += meal.total_calories || 0;
          bucket.protein += meal.total_protein || 0;
          bucket.carbs += meal.total_carbs || 0;
          bucket.fat += meal.total_fat || 0;
        }
      });

      waterLogs.forEach((log: any) => {
        const logDayKey = dayKey(new Date(log.logged_at));
        const bucket = dailyMap.get(logDayKey);
        if (!bucket) return;
        bucket.water += Number(log.volume) || 0;
      });

      const labels = days.map((day) => formatShortLabel(day, range));
      const caloriesData = dailyTotals.map((d) => Math.round(d.calories));
      const hydrationData = dailyTotals.map((d) => Math.round(d.water / 250));

      const weightData: number[] = [];
      let lastWeight = bodyMetrics.length > 0 ? bodyMetrics[0].weight_value ?? 0 : 0;
      let metricIndex = 0;

      dailyTotals.forEach((d) => {
        while (
          metricIndex < bodyMetrics.length &&
          new Date(bodyMetrics[metricIndex].measured_at) <= d.date
        ) {
          lastWeight = bodyMetrics[metricIndex].weight_value ?? lastWeight;
          metricIndex += 1;
        }
        weightData.push(Number(lastWeight || 0));
      });

      const totalCalories = caloriesData.reduce((sum, value) => sum + value, 0);
      const totalWater = dailyTotals.reduce((sum, d) => sum + d.water, 0);
      const totalMeals = dailyTotals.reduce((sum, d) => sum + d.mealCount, 0);
      const daysActive = caloriesData.filter((v) => v > 0).length;
      const currentWeight = bodyMetrics.length > 0
        ? Number(bodyMetrics[bodyMetrics.length - 1].weight_value || 0)
        : Number(weightData[weightData.length - 1] || 0);
      const weightChange = weightData.length > 1
        ? Number((weightData[weightData.length - 1] - weightData[0]).toFixed(1))
        : 0;

      const totalProtein = dailyTotals.reduce((sum, d) => sum + d.protein, 0);
      const totalCarbs = dailyTotals.reduce((sum, d) => sum + d.carbs, 0);
      const totalFat = dailyTotals.reduce((sum, d) => sum + d.fat, 0);
      const macroCalories = (totalProtein * 4) + (totalCarbs * 4) + (totalFat * 9);
      const proteinPct = macroCalories > 0 ? Math.round(((totalProtein * 4) / macroCalories) * 100) : 0;
      const carbsPct = macroCalories > 0 ? Math.round(((totalCarbs * 4) / macroCalories) * 100) : 0;
      const fatPct = macroCalories > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

      return {
        labels,
        weightData,
        caloriesData,
        hydrationData,
        macrosData: [
          {
            name: 'Proteínas',
            population: proteinPct,
            color: '#FCD34D',
            legendFontColor: '#FFFFFF',
            legendFontSize: 12,
          },
          {
            name: 'Carbohidratos',
            population: carbsPct,
            color: '#38BDF8',
            legendFontColor: '#FFFFFF',
            legendFontSize: 12,
          },
          {
            name: 'Grasas',
            population: fatPct,
            color: '#F87171',
            legendFontColor: '#FFFFFF',
            legendFontSize: 12,
          },
        ],
        summary: {
          avgCalories: Math.round(totalCalories / (range || 1)),
          totalCalories,
          totalWater,
          currentWeight,
          weightChange,
          daysActive,
          totalMeals,
        },
      };
    },
  });
};

