import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  points: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
  created_at: string;
  updated_at: string;
}

export interface UserLevel {
  level: number;
  title: string;
  min_points: number;
  color: string;
}

const LEVELS: UserLevel[] = [
  { level: 1, title: 'Principiante', min_points: 0, color: '#94A3B8' },
  { level: 2, title: 'NotFat Novato', min_points: 100, color: '#60A5FA' },
  { level: 3, title: 'NotFat Intermedio', min_points: 300, color: '#34D399' },
  { level: 4, title: 'NotFat Experto', min_points: 600, color: '#F59E0B' },
  { level: 5, title: 'NotFat Maestro', min_points: 1000, color: '#FCD34D' },
  { level: 6, title: 'NotFat Legendario', min_points: 2000, color: '#8B5CF6' },
];

export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      // Fetch user achievements
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch total points from unlocked achievements
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_achievements')
        .select('points')
        .eq('user_id', user.id)
        .eq('unlocked', true);

      if (pointsError) throw pointsError;

      const totalPoints = pointsData?.reduce((sum, achievement) => sum + achievement.points, 0) || 0;

      setAchievements(userAchievements || []);
      setUserPoints(totalPoints);
    } catch (err: any) {
      setError(err.message || 'Error al cargar logros');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    try {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error: unlockError } = await supabase
        .from('user_achievements')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('achievement_type', achievementId)
        .select()
        .maybeSingle();

      if (unlockError) throw unlockError;

      // Update local state
      setAchievements(prev => 
        prev.map(a => a.achievement_type === achievementId ? { ...a, ...data } : a)
      );

      // Update points
      setUserPoints(prev => prev + (data?.points || 0));

      return data;
    } catch (err: any) {
      console.error('Error unlocking achievement:', err);
      throw err;
    }
  }, [user?.id]);

  const updateAchievementProgress = useCallback(async (achievementId: string, progress: number) => {
    try {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error: progressError } = await supabase
        .from('user_achievements')
        .update({
          progress,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('achievement_type', achievementId)
        .select()
        .maybeSingle();

      if (progressError) throw progressError;

      // Update local state
      setAchievements(prev => 
        prev.map(a => a.achievement_type === achievementId ? { ...a, ...data } : a)
      );

      return data;
    } catch (err: any) {
      console.error('Error updating achievement progress:', err);
      throw err;
    }
  }, [user?.id]);

  const getCurrentLevel = useCallback(() => {
    return LEVELS.reverse().find(level => userPoints >= level.min_points) || LEVELS[0];
  }, [userPoints]);

  const getNextLevel = useCallback(() => {
    const current = getCurrentLevel();
    const currentIndex = LEVELS.findIndex(l => l.level === current.level);
    return LEVELS[currentIndex + 1];
  }, [getCurrentLevel]);

  const getProgressToNextLevel = useCallback(() => {
    const current = getCurrentLevel();
    const next = getNextLevel();
    
    if (!next) return 100;
    
    const progressRange = next.min_points - current.min_points;
    const userProgress = userPoints - current.min_points;
    
    return Math.min((userProgress / progressRange) * 100, 100);
  }, [getCurrentLevel, getNextLevel, userPoints]);

  // Auto-check achievements based on user activity
  const checkAchievements = useCallback(async () => {
    if (!user?.id) return;

    // Check first meal achievement
    const { data: meals } = await supabase
      .from('meals')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (meals && meals.length > 0) {
      await unlockAchievement('first_meal');
    }

    // Check water goal achievement
    const { data: waterLogs } = await supabase
      .from('water_logs')
      .select('logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (waterLogs && waterLogs.length >= 7) {
      await unlockAchievement('water_goal');
    }

    // Update progress for achievements with progress
    const { data: recipeCount } = await supabase
      .from('recipes')
      .select('id')
      .eq('user_id', user.id);

    if (recipeCount) {
      await updateAchievementProgress('recipe_master', recipeCount.length);
    }
  }, [user?.id, unlockAchievement, updateAchievementProgress]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    // Check achievements when user completes actions
    checkAchievements();
  }, [checkAchievements]);

  return {
    achievements,
    userPoints,
    loading,
    error,
    currentLevel: getCurrentLevel(),
    nextLevel: getNextLevel(),
    progressToNextLevel: getProgressToNextLevel(),
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalAchievements: achievements.length,
    fetchAchievements,
    unlockAchievement,
    updateAchievementProgress,
  };
};
