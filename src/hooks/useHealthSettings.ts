import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

export interface HealthSettings {
  id: string;
  user_id: string;
  health_platform?: string;
  connected_at?: string;
  disconnected_at?: string;
  eat_back_exercise_calories?: boolean;
  eat_back_neat_calories?: boolean;
  sync_weight?: boolean;
  created_at: string;
  updated_at: string;
  // Additional properties for the screen
  connected_platforms?: string[];
  last_sync?: string;
  share_health_data?: boolean;
  anonymous_data?: boolean;
}

export interface HealthDailySnapshot {
  id: string;
  date: string;
  steps?: number;
  active_calories_burned?: number;
  workout_calories_burned?: number;
  workout_count?: number;
  workout_minutes?: number;
  weight_kg?: number;
  sleep_hours?: number;
  sleep_quality?: string;
  synced_at: string;
  source?: string;
}

export interface UserSports {
  id: string;
  sport_type: string;
  hours_per_week?: number;
  created_at: string;
  updated_at: string;
}

export interface ManualWorkout {
  id: string;
  workout_date: string;
  sport_type: string;
  duration_minutes: number;
  estimated_calories: number;
  created_at: string;
}

export const useHealthSettings = () => {
  const { user } = useAuthStore();
  const [healthSettings, setHealthSettings] = useState<HealthSettings | null>(null);
  const [dailySnapshots, setDailySnapshots] = useState<HealthDailySnapshot[]>([]);
  const [userSports, setUserSports] = useState<UserSports[]>([]);
  const [manualWorkouts, setManualWorkouts] = useState<ManualWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchHealthSettings();
      fetchDailySnapshots();
      fetchUserSports();
      fetchManualWorkouts();
    }
  }, [user?.id]);

  const fetchHealthSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('health_settings')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setHealthSettings(data);
    } catch (error) {
      console.error('Error fetching health settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailySnapshots = async () => {
    try {
      const { data, error } = await supabase
        .from('health_daily_snapshots')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setDailySnapshots(data || []);
    } catch (error) {
      console.error('Error fetching daily snapshots:', error);
    }
  };

  const fetchUserSports = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sports')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      setUserSports(data || []);
    } catch (error) {
      console.error('Error fetching user sports:', error);
    }
  };

  const fetchManualWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_workouts')
        .select('*')
        .eq('user_id', user!.id)
        .order('workout_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setManualWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching manual workouts:', error);
    }
  };

  const updateHealthSettings = async (updates: Partial<HealthSettings>) => {
    try {
      const { data, error } = await supabase
        .from('health_settings')
        .upsert({
          user_id: user!.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setHealthSettings(data);
    } catch (error) {
      console.error('Error updating health settings:', error);
      throw error;
    }
  };

  const connectPlatform = async (platform: string) => {
    try {
      const { data, error } = await supabase
        .from('health_settings')
        .upsert({
          user_id: user!.id,
          health_platform: platform,
          connected_at: new Date().toISOString(),
          disconnected_at: null,
        })
        .select()
        .single();

      if (error) throw error;
      setHealthSettings(data);
    } catch (error) {
      console.error('Error connecting platform:', error);
      throw error;
    }
  };

  const disconnectPlatform = async () => {
    try {
      const { data, error } = await supabase
        .from('health_settings')
        .update({
          health_platform: null,
          disconnected_at: new Date().toISOString(),
        })
        .eq('user_id', user!.id)
        .select()
        .single();

      if (error) throw error;
      setHealthSettings(data);
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      throw error;
    }
  };

  const addManualWorkout = async (workout: Omit<ManualWorkout, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('manual_workouts')
        .insert({
          user_id: user!.id,
          ...workout,
        })
        .select()
        .single();

      if (error) throw error;
      setManualWorkouts(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding manual workout:', error);
      throw error;
    }
  };

  const addSport = async (sport: Omit<UserSports, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('user_sports')
        .insert({
          user_id: user!.id,
          ...sport,
        })
        .select()
        .single();

      if (error) throw error;
      setUserSports(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding sport:', error);
      throw error;
    }
  };

  const syncHealthData = async () => {
    try {
      // Aquí iría la lógica de sincronización con la plataforma conectada
      console.log('Syncing health data...');
      
      // Simular sincronización
      await updateHealthSettings({
        updated_at: new Date().toISOString(),
      });

      // Actualizar snapshots locales
      await fetchDailySnapshots();
    } catch (error) {
      console.error('Error syncing health data:', error);
      throw error;
    }
  };

  return {
    healthSettings,
    dailySnapshots,
    userSports,
    manualWorkouts,
    isLoading,
    updateHealthSettings,
    connectPlatform,
    disconnectPlatform,
    addManualWorkout,
    addSport,
    syncHealthData,
    refetch: () => {
      fetchHealthSettings();
      fetchDailySnapshots();
      fetchUserSports();
      fetchManualWorkouts();
    },
  };
};
