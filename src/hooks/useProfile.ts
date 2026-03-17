import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import { Database } from '@/types/database';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type NutritionGoalInsert = Database['public']['Tables']['nutrition_goals']['Insert'];
type HydrationGoalInsert = Database['public']['Tables']['hydration_goals']['Insert'];
type UserActivityProfileRow = Database['public']['Tables']['user_activity_profile']['Row'];
type UserActivityProfileUpsert = Database['public']['Tables']['user_activity_profile']['Insert'];

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

  const { data: activityProfile } = useQuery({
    queryKey: ['user_activity_profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_activity_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If missing row, treat as null
      if (error && (error as any).code === 'PGRST116') return null;
      if (error) throw error;
      return data as UserActivityProfileRow;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.functions.invoke('update-profile', {
        body: { updates, userId: user.id },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (imageUri: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const fileName = `${user.id}/${Date.now()}.jpg`;
      
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      return await updateProfile.mutateAsync({ avatar_url: publicUrl });
    },
  });

  const updateNutritionGoals = useMutation({
    mutationFn: async (goals: Omit<NutritionGoalInsert, 'user_id' | 'start_date' | 'end_date'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      // We insert a new record for goals to keep history, or update current. 
      // Typically goals are time-bound. For now, let's just insert a new one as "current"
      const { data, error } = await supabase
        .from('nutrition_goals')
        .insert({
          ...goals,
          user_id: user.id,
          start_date: new Date().toISOString(),
          source: (goals as any).source || 'manual',
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
    mutationFn: async (goals: Omit<HydrationGoalInsert, 'user_id' | 'start_date' | 'end_date'>) => {
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

  const upsertActivityProfile = useMutation({
    mutationFn: async (payload: Partial<UserActivityProfileUpsert>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_activity_profile')
        .upsert({
          user_id: user.id,
          activity_system_version: 'v2',
          ...payload,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as UserActivityProfileRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_activity_profile', user?.id] });
    },
  });

  const mapWorkoutFrequencyToDailyActivityLevel = (
    workoutFrequency?: string | null
  ): 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' => {
    switch ((workoutFrequency || '').toLowerCase()) {
      case 'sedentary':
        return 'sedentary';
      case 'light':
        return 'lightly_active';
      case 'moderate':
        return 'moderately_active';
      case 'active':
        return 'very_active';
      case 'very_active':
        return 'extra_active';
      default:
        return 'moderately_active';
    }
  };

  const { signOut: authSignOut } = useAuthStore();

  return {
    profile,
    isLoading,
    nutritionGoals,
    hydrationGoals,
    activityProfile,
    updateProfile,
    uploadAvatar,
    updateNutritionGoals,
    updateHydrationGoals,
    upsertActivityProfile,
    signOut: authSignOut,
    generateAutomaticGoals: async () => {
      if (!profile) throw new Error('No profile found');
      
      const { calculateNutritionGoalsWithAI, calculateAge } = await import('@/utils/nutrition');
      
      const age = profile.birth_date ? calculateAge(profile.birth_date) : 30;
      const weight = profile.weight_value || 70;
      const height = profile.height_value || 170;
      const gender = (profile.gender as any) || 'male';

      const goals = await calculateNutritionGoalsWithAI({
        age,
        weight,
        height,
        gender,
        activityLevel:
          (activityProfile?.daily_activity_level as any) ||
          mapWorkoutFrequencyToDailyActivityLevel(profile.workout_frequency),
        goal: (profile.nutrition_goal as any) || 'maintain',
      }, profile);

      const result = await updateNutritionGoals.mutateAsync({
        calories: goals.calories,
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat,
        source: 'ia' as any, // Marcar como generado por IA
      });

      return result;
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
