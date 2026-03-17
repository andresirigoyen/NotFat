import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export const useHealthDailySnapshots = (userId: string) => {
  return useQuery({
    queryKey: ['health_daily_snapshots', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_daily_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30); // Last 30 days

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useAddHealthSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshotData: {
      date: string;
      steps?: number;
      active_calories_burned?: number;
      workout_calories_burned?: number;
      workout_count?: number;
      workout_minutes?: number;
      weight_kg?: number;
      sleep_hours?: number;
      sleep_quality?: string;
      source?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('health_daily_snapshots')
        .upsert({
          ...snapshotData,
          user_id: user.id,
          synced_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['health_daily_snapshots', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['health_stats', data.user_id] });
    },
  });
};

export const useHealthStats = (userId: string) => {
  return useQuery({
    queryKey: ['health_stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_daily_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 7 days
        .order('date', { ascending: true });

      if (error) throw error;

      // Calculate averages and totals
      const totalSteps = data.reduce((sum: number, day: any) => sum + (day.steps || 0), 0);
      const avgSteps = Math.round(totalSteps / (data.length || 1));
      
      const totalWorkouts = data.reduce((sum: number, day: any) => sum + (day.workout_count || 0), 0);
      const totalWorkoutMinutes = data.reduce((sum: number, day: any) => sum + (day.workout_minutes || 0), 0);
      
      const avgSleep = data.reduce((sum: number, day: any) => sum + (day.sleep_hours || 0), 0) / (data.length || 1);
      
      const avgActiveCalories = data.reduce((sum: number, day: any) => sum + (day.active_calories_burned || 0), 0) / (data.length || 1);

      return {
        avgSteps,
        totalWorkouts,
        totalWorkoutMinutes,
        avgSleep: Math.round(avgSleep * 10) / 10,
        avgActiveCalories: Math.round(avgActiveCalories),
        dailyData: data,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
