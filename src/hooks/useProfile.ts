import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import { Database } from '@/types/database';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type NutritionGoalInsert = Database['public']['Tables']['nutrition_goals']['Insert'];
type HydrationGoalInsert = Database['public']['Tables']['hydration_goals']['Insert'];

export const useProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: nutritionGoals } = useQuery({
    queryKey: ['nutrition_goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id,
  });

  const { data: hydrationGoals } = useQuery({
    queryKey: ['hydration_goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('hydration_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateNutritionGoals = useMutation({
    mutationFn: async (goals: Omit<NutritionGoalInsert, 'user_id' | 'start_date'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      // We insert a new record for goals to keep history, or update current. 
      // Typically goals are time-bound. For now, let's just insert a new one as "current"
      const { data, error } = await supabase
        .from('nutrition_goals')
        .insert({
          ...goals,
          user_id: user.id,
          start_date: new Date().toISOString(),
          source: 'manual',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition_goals', user?.id] });
    },
  });

  const updateHydrationGoals = useMutation({
    mutationFn: async (goals: Omit<HydrationGoalInsert, 'user_id' | 'start_date'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('hydration_goals')
        .insert({
          ...goals,
          user_id: user.id,
          start_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hydration_goals', user?.id] });
    },
  });

  return {
    profile,
    isLoading,
    nutritionGoals,
    hydrationGoals,
    updateProfile,
    updateNutritionGoals,
    updateHydrationGoals,
    generateAutomaticGoals: async () => {
      if (!profile) throw new Error('No profile found');
      
      const { calculateFinalGoals, calculateAge } = await import('@/utils/nutrition');
      
      const age = profile.birth_date ? calculateAge(profile.birth_date) : 30;
      const weight = profile.weight_value || 70;
      const height = profile.height_value || 170;
      const gender = profile.gender || 'male';

      const goals = calculateFinalGoals({
        age,
        weight,
        height,
        gender,
        activityLevel: 'moderately_active', // Default or from profile if available
        goal: (profile.nutrition_goal as any) || 'maintain',
      });

      return await updateNutritionGoals.mutateAsync({
        ...goals,
        source: 'algorithm',
      });
    },
    generateAutomaticHydrationGoal: async () => {
      if (!profile) throw new Error('No profile found');
      const { calculateHydration } = await import('@/utils/nutrition');
      const target = calculateHydration(profile.weight_value || 70);
      return await updateHydrationGoals.mutateAsync({
        target,
        target_unit: 'ml',
      });
    },
  };
};
