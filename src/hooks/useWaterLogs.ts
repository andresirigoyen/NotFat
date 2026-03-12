import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { Database } from '@/types/database';

type WaterLog = Database['public']['Tables']['water_logs']['Row'];
type NewWaterLog = Database['public']['Tables']['water_logs']['Insert'];

export const useWaterLogs = (userId: string) => {
  return useQuery({
    queryKey: ['water_logs', userId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', today.toISOString())
        .lt('logged_at', tomorrow.toISOString())
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return data as WaterLog[];
    },
    enabled: !!userId,
  });
};

export const useAddWater = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLog: Omit<Partial<NewWaterLog>, 'user_id' | 'logged_at'> & { volume: number; unit: 'ml' | 'oz' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('water_logs')
        .insert({
          ...newLog,
          user_id: user.id,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as WaterLog;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['water_logs', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['daily_totals', data.user_id] });
    },
  });
};
