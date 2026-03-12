import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';

interface WaterLog {
  id: string;
  user_id: string;
  amount: number;
  unit: 'ml' | 'oz';
  logged_at: string;
  timezone: string;
}

interface HydrationGoal {
  id: string;
  user_id: string;
  daily_goal: number;
  unit: 'ml' | 'oz';
  preferred_bottle_size: number;
  preferred_bottle_unit: 'ml' | 'oz';
  reminder_frequency: 'hourly' | '2hours' | '3hours' | '4hours';
  reminder_enabled: boolean;
}

export const useHydration = () => {
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [hydrationGoal, setHydrationGoal] = useState<HydrationGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Default hydration goals based on user profile
  const getDefaultGoal = (weight?: number, weightUnit?: string) => {
    // Calculate goal: 35ml per kg of body weight
    if (weight && weightUnit === 'kg') {
      return Math.round(weight * 35);
    }
    return 2000; // Default 2L for adults
  };

  const fetchHydrationData = async (date: Date = new Date()) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch water logs for the day
      const { data: logs, error: logsError } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString())
        .order('logged_at', { ascending: false });

      if (logsError) throw logsError;

      // Fetch hydration goal
      const { data: goal, error: goalError } = await supabase
        .from('hydration_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (goalError && goalError.code !== 'PGRST116') {
        throw goalError;
      }

      setWaterLogs(logs || []);
      
      if (goal) {
        setHydrationGoal(goal);
      } else {
        // Create default goal
        await createDefaultHydrationGoal();
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de hidratación');
      console.error('Hydration data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultHydrationGoal = async () => {
    if (!user) return;

    try {
      const defaultGoal = getDefaultGoal();
      
      const { data, error } = await supabase
        .from('hydration_goals')
        .insert({
          user_id: user.id,
          daily_goal: defaultGoal,
          unit: 'ml',
          preferred_bottle_size: 500,
          preferred_bottle_unit: 'ml',
          reminder_frequency: '2hours',
          reminder_enabled: true
        })
        .select()
        .single();

      if (error) throw error;
      setHydrationGoal(data);
    } catch (err) {
      console.error('Error creating default hydration goal:', err);
    }
  };

  const addWaterLog = async (amount: number, unit: 'ml' | 'oz' = 'ml') => {
    if (!user || !hydrationGoal) return;

    setLoading(true);
    setError(null);

    try {
      // Convert to goal unit if needed
      let convertedAmount = amount;
      if (unit !== hydrationGoal.unit) {
        convertedAmount = unit === 'ml' ? amount / 29.5735 : amount * 29.5735;
      }

      const { data, error } = await supabase
        .from('water_logs')
        .insert({
          user_id: user.id,
          amount: convertedAmount,
          unit: hydrationGoal.unit,
          logged_at: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
        .select()
        .single();

      if (error) throw error;

      setWaterLogs(prev => [data, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Error al registrar consumo de agua');
      console.error('Add water log error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteWaterLog = async (logId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWaterLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar registro de agua');
      console.error('Delete water log error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateHydrationGoal = async (updates: Partial<HydrationGoal>) => {
    if (!user || !hydrationGoal) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('hydration_goals')
        .update(updates)
        .eq('id', hydrationGoal.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setHydrationGoal(data);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar meta de hidratación');
      console.error('Update hydration goal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTodayProgress = () => {
    if (!hydrationGoal) return { consumed: 0, goal: 0, percentage: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = waterLogs.filter(log => {
      const logDate = new Date(log.logged_at);
      return logDate >= today;
    });

    const consumed = todayLogs.reduce((total, log) => total + log.amount, 0);
    const percentage = hydrationGoal.daily_goal > 0 ? (consumed / hydrationGoal.daily_goal) * 100 : 0;

    return {
      consumed,
      goal: hydrationGoal.daily_goal,
      percentage: Math.min(percentage, 100),
      unit: hydrationGoal.unit
    };
  };

  const getWeeklyProgress = () => {
    if (!hydrationGoal) return { consumed: 0, goal: 0, percentage: 0, daily: [] };

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekLogs = waterLogs.filter(log => {
      const logDate = new Date(log.logged_at);
      return logDate >= weekStart;
    });

    const consumed = weekLogs.reduce((total, log) => total + log.amount, 0);
    const goal = hydrationGoal.daily_goal * 7;
    const percentage = goal > 0 ? (consumed / goal) * 100 : 0;

    // Calculate daily consumption
    const daily = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      
      const dayLogs = waterLogs.filter(log => {
        const logDate = new Date(log.logged_at);
        return logDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toISOString().split('T')[0],
        consumed: dayLogs.reduce((total, log) => total + log.amount, 0),
        goal: hydrationGoal.daily_goal
      };
    });

    return {
      consumed,
      goal,
      percentage: Math.min(percentage, 100),
      unit: hydrationGoal.unit,
      daily
    };
  };

  useEffect(() => {
    if (user) {
      fetchHydrationData();
    }
  }, [user]);

  return {
    waterLogs,
    hydrationGoal,
    loading,
    error,
    addWaterLog,
    deleteWaterLog,
    updateHydrationGoal,
    fetchHydrationData,
    getTodayProgress,
    getWeeklyProgress
  };
};
