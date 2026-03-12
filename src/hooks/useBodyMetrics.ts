import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { Database } from '@/types/database';

type BodyMetric = Database['public']['Tables']['body_metrics']['Row'];
type NewBodyMetric = Database['public']['Tables']['body_metrics']['Insert'];

export const useBodyMetrics = (userId: string) => {
  return useQuery({
    queryKey: ['body_metrics', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('measured_at', { ascending: true });

      if (error) throw error;
      return data as BodyMetric[];
    },
    enabled: !!userId,
  });
};

export const useAddBodyMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMetric: Partial<Omit<NewBodyMetric, 'user_id'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('body_metrics')
        .insert({
          ...newMetric,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update profile with latest weight if it's the newest entry
      if (newMetric.weight_value) {
        await supabase
          .from('profiles')
          .update({ 
            weight_value: newMetric.weight_value,
            weight_unit: newMetric.weight_unit 
          })
          .eq('id', user.id);
      }

      return data as BodyMetric;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['body_metrics', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['profile', data.user_id] });
    },
  });
};
