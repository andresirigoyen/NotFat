import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface DailyTip {
  id: number;
  emoji: string;
  category: string;
  title: string;
  description: string;
  used_at?: string;
  created_at: string;
}

interface UserTipHistory {
  tip_id: number;
  used_at: string;
  tip: DailyTip;
}

export const useDailyTips = () => {
  return useQuery({
    queryKey: ['daily_tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_tips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DailyTip[];
    },
  });
};

export const useTodaysTip = (userId: string) => {
  return useQuery({
    queryKey: ['todays_tip', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // First check if user already has a tip for today
      const { data: usedTip, error: usedError } = await supabase
        .from('daily_tips_used')
        .select(`
          *,
          daily_tips(*)
        `)
        .eq('user_id', userId)
        .eq('used_at', today)
        .single();

      if (usedError && usedError.code !== 'PGRST116') {
        throw usedError;
      }

      if (usedTip) {
        return usedTip.daily_tips as DailyTip;
      }

      // Get a new tip that hasn't been used recently
      const { data: recentTipIds } = await supabase
        .from('daily_tips_used')
        .select('tip_id')
        .eq('user_id', userId)
        .gte('used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const excludeIds = recentTipIds?.map(t => t.tip_id) || [];

      const { data: availableTips, error: tipsError } = await supabase
        .from('daily_tips')
        .select('*')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('RANDOM()')
        .limit(1);

      if (tipsError) throw tipsError;

      // If we have an available tip, mark it as used
      if (availableTips && availableTips.length > 0) {
        const tip = availableTips[0];
        
        await supabase
          .from('daily_tips_used')
          .insert({
            user_id: userId,
            tip_id: tip.id,
            used_at: today,
          });

        return tip as DailyTip;
      }

      // Fallback: get any random tip if all have been used recently
      const { data: fallbackTip, error: fallbackError } = await supabase
        .from('daily_tips')
        .select('*')
        .order('RANDOM()')
        .limit(1);

      if (fallbackError) throw fallbackError;

      if (fallbackTip && fallbackTip.length > 0) {
        const tip = fallbackTip[0];
        
        await supabase
          .from('daily_tips_used')
          .insert({
            user_id: userId,
            tip_id: tip.id,
            used_at: today,
          });

        return tip as DailyTip;
      }

      return null;
    },
    enabled: !!userId,
  });
};

export const useMarkTipAsUsed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, tipId }: { userId: string; tipId: number }) => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_tips_used')
        .insert({
          user_id: userId,
          tip_id: tipId,
          used_at: today,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todays_tip'] });
      queryClient.invalidateQueries({ queryKey: ['user_tip_history'] });
    },
  });
};

export const useUserTipHistory = (userId: string, limit = 30) => {
  return useQuery({
    queryKey: ['user_tip_history', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_tips_used')
        .select(`
          *,
          daily_tips(*)
        `)
        .eq('user_id', userId)
        .order('used_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as UserTipHistory[];
    },
    enabled: !!userId,
  });
};

export const useCreateDailyTip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tipData: {
      emoji?: string;
      category: string;
      title: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from('daily_tips')
        .insert({
          emoji: tipData.emoji || '💡',
          category: tipData.category,
          title: tipData.title,
          description: tipData.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DailyTip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tips'] });
    },
  });
};

export const useUpdateDailyTip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      tipId, 
      updates 
    }: { 
      tipId: number; 
      updates: Partial<DailyTip>;
    }) => {
      const { data, error } = await supabase
        .from('daily_tips')
        .update(updates)
        .eq('id', tipId)
        .select()
        .single();

      if (error) throw error;
      return data as DailyTip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tips'] });
    },
  });
};

export const useDeleteDailyTip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tipId: number) => {
      const { error } = await supabase
        .from('daily_tips')
        .delete()
        .eq('id', tipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_tips'] });
    },
  });
};

export const useTipCategories = () => {
  return useQuery({
    queryKey: ['tip_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_tips')
        .select('category')
        .order('category');

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set(data?.map(t => t.category) || [])];
      return categories;
    },
  });
};

export const useTipsByCategory = (category?: string) => {
  return useQuery({
    queryKey: ['tips_by_category', category],
    queryFn: async () => {
      let query = supabase
        .from('daily_tips')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DailyTip[];
    },
  });
};

// Hook for getting personalized tips based on user data
export const usePersonalizedTips = (userId: string) => {
  return useQuery({
    queryKey: ['personalized_tips', userId],
    queryFn: async () => {
      // Get user profile and recent activity
      const [profileResult, mealsResult, healthResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase
          .from('meals')
          .select('meal_at, food_items(calories, protein)')
          .eq('user_id', userId)
          .gte('meal_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('health_daily_snapshots')
          .select('steps, sleep_hours')
          .eq('user_id', userId)
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ]);

      if (profileResult.error || mealsResult.error || healthResult.error) {
        throw new Error('Failed to fetch user data for personalization');
      }

      const profile = profileResult.data;
      const recentMeals = mealsResult.data || [];
      const healthData = healthResult.data || [];

      // Analyze user patterns to determine relevant categories
      const relevantCategories = [];

      // Check nutrition patterns
      const avgCalories = recentMeals.reduce((sum: number, meal: any) => {
        return sum + (meal.food_items?.reduce((mealSum: number, item: any) => mealSum + (item.calories || 0), 0) || 0);
      }, 0) / Math.max(recentMeals.length, 1);

      if (avgCalories < 1500) {
        relevantCategories.push('nutrición', 'energía');
      } else if (avgCalories > 2500) {
        relevantCategories.push('moderación', 'equilibrio');
      }

      // Check activity patterns
      const avgSteps = healthData.reduce((sum: number, day: any) => sum + (day.steps || 0), 0) / Math.max(healthData.length, 1);
      
      if (avgSteps < 5000) {
        relevantCategories.push('actividad', 'movimiento');
      } else if (avgSteps > 10000) {
        relevantCategories.push('recuperación', 'descanso');
      }

      // Check sleep patterns
      const avgSleep = healthData.reduce((sum: number, day: any) => sum + (day.sleep_hours || 0), 0) / Math.max(healthData.length, 1);
      
      if (avgSleep < 7) {
        relevantCategories.push('sueño', 'descanso');
      }

      // Add general wellness categories
      relevantCategories.push('bienestar', 'hábitos', 'motivación');

      // Get tips from relevant categories
      const { data: tips, error: tipsError } = await supabase
        .from('daily_tips')
        .select('*')
        .in('category', relevantCategories)
        .order('RANDOM()')
        .limit(5);

      if (tipsError) throw tipsError;

      return tips as DailyTip[];
    },
    enabled: !!userId,
  });
};

// Hook for getting tip engagement analytics
export const useTipAnalytics = () => {
  return useQuery({
    queryKey: ['tip_analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_tips_used')
        .select(`
          used_at,
          daily_tips(
            category,
            emoji
          )
        `)
        .gte('used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Analyze usage patterns
      const categoryUsage: Record<string, number> = {};
      const dailyUsage: Record<string, number> = {};

      data?.forEach((usage: any) => {
        const category = usage.daily_tips?.category || 'unknown';
        const date = usage.used_at.split('T')[0];

        categoryUsage[category] = (categoryUsage[category] || 0) + 1;
        dailyUsage[date] = (dailyUsage[date] || 0) + 1;
      });

      const totalUsage = data?.length || 0;
      const mostPopularCategory = Object.entries(categoryUsage)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

      return {
        totalUsage,
        categoryUsage,
        dailyUsage,
        mostPopularCategory,
        averageDailyUsage: totalUsage / 30,
      };
    },
  });
};
