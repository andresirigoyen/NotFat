import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportError } from '@/services/sentry';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import { Database } from '@/types/database';

type WaterLog = Database['public']['Tables']['water_logs']['Row'];
type WaterLogInsert = Database['public']['Tables']['water_logs']['Insert'];

export function useWater() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Get today's water logs
  const {
    data: todayWaterLogs,
    isLoading: todayWaterLoading,
    refetch: refetchTodayWater,
  } = useQuery({
    queryKey: ['water_logs', user?.id, 'today'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', new Date().toISOString().split('T')[0])
        .order('logged_at', { ascending: true });

      if (error) throw error;
      return data as WaterLog[];
    },
    enabled: !!user?.id,
  });

  // Get water logs for a specific date
  const getWaterLogsByDate = (date: string) => {
    return useQuery({
      queryKey: ['water_logs', user?.id, date],
      queryFn: async () => {
        if (!user?.id) return [];
        
        const { data, error } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', date)
          .order('logged_at', { ascending: true });

        if (error) throw error;
        return data as WaterLog[];
      },
      enabled: !!user?.id && !!date,
    });
  };

  // Add water log mutation
  const addWaterMutation = useMutation({
    mutationFn: async (waterData: Omit<WaterLogInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('water_logs')
        .insert({
          ...waterData,
          user_id: user.id,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as WaterLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water_logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals'] });
    },
  });

  // Delete water log mutation
  const deleteWaterMutation = useMutation({
    mutationFn: async (waterLogId: string) => {
      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', waterLogId);

      if (error) throw error;
      return waterLogId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water_logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals'] });
    },
  });

  // Helper functions
  const addWater = async (amount: number, unit: 'ml' | 'oz' = 'ml') => {
    return await addWaterMutation.mutateAsync({
      volume: amount,
      unit,
      recorded_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      logged_at: new Date().toISOString(),
    });
  };

  const deleteWater = async (waterLogId: string) => {
    return await deleteWaterMutation.mutateAsync(waterLogId);
  };

  // Calculate today's total water intake
  const todayTotal = todayWaterLogs?.reduce((total, log) => {
    return total + (log.unit === 'oz' ? log.volume * 29.5735 : log.volume); // Convert oz to ml
  }, 0) || 0;

  return {
    // Queries
    todayWaterLogs,
    todayWaterLoading,
    todayTotal,
    getWaterLogsByDate,
    
    // Mutations
    addWater,
    deleteWater,
    
    // Loading states
    isAddingWater: addWaterMutation.isPending,
    isDeletingWater: deleteWaterMutation.isPending,
    
    // Refetch
    refetchTodayWater,
  };
}
