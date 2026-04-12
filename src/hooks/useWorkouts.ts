import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

export const useWorkouts = (userId: string) => {
  return useQuery({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useAddWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutData: {
      sport_type: string;
      duration_minutes: number;
      estimated_calories: number;
      workout_date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('manual_workouts')
        .insert({
          ...workoutData,
          user_id: user.id,
          workout_date: workoutData.workout_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['workout_stats', data.user_id] });
    },
  });
};

export const useWorkoutStats = (userId: string) => {
  return useQuery({
    queryKey: ['workout_stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('workout_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
        .order('workout_date', { ascending: true });

      if (error) throw error;

      // Calculate stats
      const totalWorkouts = data?.length || 0;
      const totalMinutes = data?.reduce((sum: number, workout: any) => sum + workout.duration_minutes, 0) || 0;
      const totalCalories = data?.reduce((sum: number, workout: any) => sum + workout.estimated_calories, 0) || 0;
      
      const avgMinutes = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
      const avgCalories = totalWorkouts > 0 ? Math.round(totalCalories / totalWorkouts) : 0;

      // Group by sport type
      const sportStats: Record<string, { count: number; minutes: number; calories: number }> = {};
      data.forEach((workout: any) => {
        if (!sportStats[workout.sport_type]) {
          sportStats[workout.sport_type] = { count: 0, minutes: 0, calories: 0 };
        }
        sportStats[workout.sport_type].count++;
        sportStats[workout.sport_type].minutes += workout.duration_minutes;
        sportStats[workout.sport_type].calories += workout.estimated_calories;
      });

      return {
        totalWorkouts,
        totalMinutes,
        totalCalories,
        avgMinutes,
        avgCalories,
        sportStats,
        recentWorkouts: data?.slice(0, 10) || [],
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUserSports = (userId: string) => {
  return useQuery({
    queryKey: ['user_sports', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_sports')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const useUpdateUserSports = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sportsData: Array<{
      sport_type: string;
      hours_per_week?: number;
    }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Delete existing sports
      await supabase
        .from('user_sports')
        .delete()
        .eq('user_id', user.id);

      // Insert new sports
      if (sportsData.length > 0) {
        const { data, error } = await supabase
          .from('user_sports')
          .insert(
            sportsData.map(sport => ({
              ...sport,
              user_id: user.id,
            }))
          )
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user_sports', data[0].user_id] });
      }
    },
  });
};
