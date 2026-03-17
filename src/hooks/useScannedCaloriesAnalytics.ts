import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface DailyScannedRatio {
  user_id: string;
  day: string;
  total_calories: number | null;
  scanned_calories: number | null;
  scanned_calories_ratio: number | null;
}

interface TopScannedProduct {
  barcode_number: string | null;
  name: string | null;
  times_scanned: number;
  total_calories_from_scans: number;
  avg_calories_per_scan: number;
}

export const useScannedCaloriesAnalytics = (userId: string | undefined, date: Date) => {
  return useQuery({
    queryKey: ['scanned_calories_analytics', userId, date.toISOString().split('T')[0]],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) {
        return {
          ratio: 0,
          scannedCalories: 0,
          totalCalories: 0,
          topProducts: [] as TopScannedProduct[],
        };
      }

      const isoDay = date.toISOString().split('T')[0];

      // 1) Ratio diario desde la vista daily_calories_with_scanned_ratio
      const { data: ratioRows, error: ratioError } = await supabase
        .from<DailyScannedRatio>('daily_calories_with_scanned_ratio')
        .select('*')
        .eq('user_id', userId)
        .eq('day', isoDay)
        .maybeSingle();

      if (ratioError) {
        console.error('Error fetching daily_calories_with_scanned_ratio:', ratioError.message);
      }

      // 2) Top productos escaneados globales (limit 3)
      const { data: topRows, error: topError } = await supabase
        .from<TopScannedProduct>('top_scanned_products_by_calories')
        .select('*')
        .limit(3);

      if (topError) {
        console.error('Error fetching top_scanned_products_by_calories:', topError.message);
      }

      const totalCalories = ratioRows?.total_calories || 0;
      const scannedCalories = ratioRows?.scanned_calories || 0;
      const ratio = totalCalories > 0
        ? (scannedCalories / totalCalories) * 100
        : 0;

      return {
        ratio: Math.round(ratio),
        scannedCalories: Math.round(scannedCalories),
        totalCalories: Math.round(totalCalories),
        topProducts: topRows || [],
      };
    },
  });
};

