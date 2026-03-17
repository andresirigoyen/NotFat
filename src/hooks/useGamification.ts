import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
}

interface UserPoints {
  total_points: number;
  level: number;
  streak_days: number;
  badges_earned: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  duration_days: number;
  category: string;
  user_progress?: {
    progress: number;
    completed: boolean;
    joined_at?: string;
  };
}

export const useUserAchievements = (userId: string) => {
  return useQuery({
    queryKey: ['user_achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements(*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data as (Achievement & { achievements: Achievement })[];
    },
    enabled: !!userId,
  });
};

export const useUserPoints = (userId: string) => {
  return useQuery({
    queryKey: ['user_points', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserPoints;
    },
    enabled: !!userId,
  });
};

export const useActiveChallenges = (userId: string) => {
  return useQuery({
    queryKey: ['active_challenges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_participants!inner(
            progress,
            completed,
            joined_at
          )
        `)
        .eq('challenge_participants.user_id', userId)
        .eq('active', true);

      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!userId,
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, userId }: { challengeId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          progress: 0,
          completed: false,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active_challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user_points'] });
    },
  });
};

export const useUpdateChallengeProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      challengeId, 
      userId, 
      progress 
    }: { 
      challengeId: string; 
      userId: string; 
      progress: number;
    }) => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .update({ 
          progress,
          completed: progress >= 100,
          completed_at: progress >= 100 ? new Date().toISOString() : null
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active_challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user_points'] });
    },
  });
};

export const useUnlockAchievement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      achievementId, 
      userId 
    }: { 
      achievementId: string; 
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          achievement_id: achievementId,
          user_id: userId,
          unlocked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_achievements'] });
      queryClient.invalidateQueries({ queryKey: ['user_points'] });
    },
  });
};
