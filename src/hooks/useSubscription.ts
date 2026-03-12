import { useState } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import { Linking } from 'react-native';

export const useSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const createPreference = async (planType: 'monthly' | 'yearly') => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Call Edge Function to create MercadoPago preference
      const { data, error: functionError } = await supabase.functions.invoke('create-mp-preference', {
        body: { 
          planType, 
          userId: user.id,
          email: user.email 
        },
      });

      if (functionError) throw functionError;

      // 2. Redirect user to MercadoPago checkout
      if (data?.init_point) {
        await Linking.openURL(data.init_point);
      } else {
        throw new Error('No se pudo generar el link de pago');
      }

      return data;
    } catch (err: any) {
      setError(err.message || 'Error al procesar la suscripción');
      console.error('Subscription Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_ends_at')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    return data;
  };

  return {
    createPreference,
    checkStatus,
    loading,
    error,
  };
};
