import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
import { Linking } from 'react-native';

export interface Subscription {
  id: string;
  user_id?: string;
  mercadopago_id?: string;
  plan_type: string;
  status: string;
  amount?: number;
  currency?: string;
  start_date?: string;
  trial_end_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  payment_provider?: string;
  provider_subscription_id?: string;
  revenuecat_id?: string;
  environment?: string;
  offer_code?: string;
  applied_offer_code?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  mercadopago_payment_id?: string;
  status: string;
  status_detail?: string;
  payment_type?: string;
  amount: number;
  currency: string;
  payment_date: string;
  last_modified: string;
  payment_data?: any;
  created_at: string;
  updated_at: string;
  operation_type?: string;
  revenuecat_payment_id?: string;
  environment?: string;
}

export const useSubscriptionEnhanced = () => {
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // ✅ FIX #16: Cargar ambos en paralelo con un único estado de carga compartido
      loadAllData();
    }
  }, [user?.id]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchSubscription(), fetchPayments()]);
      // Trigger a refresh of the global auth status to sync isPro
      const { refreshProfile } = useAuthStore.getState();
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    }
    // ✅ FIX #16: isLoading ahora es controlado por loadAllData, no por esta función
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user!.id)
        .order('payment_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const createSubscription = async (subscriptionData: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user!.id,
          ...subscriptionData,
          status: 'pending',
          start_date: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
      await fetchPayments();
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  const upgradeSubscription = async (upgradeData: {
    planType: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    promoCode?: string;
  }) => {
    try {
      setIsLoading(true);
      
      // Crear nueva suscripción
      const newSubscription = await createSubscription({
        plan_type: upgradeData.planType,
        amount: upgradeData.amount,
        currency: upgradeData.currency,
        payment_provider: upgradeData.paymentMethod,
        applied_offer_code: upgradeData.promoCode,
        status: 'pending',
      });

      // MercadoPago checkout (real)
      if (upgradeData.paymentMethod === 'mercadopago') {
        const { data, error } = await supabase.functions.invoke('create-mp-preference', {
          body: {
            planType: upgradeData.planType === 'premium' ? 'monthly' : upgradeData.planType,
            userId: user!.id,
            email: user!.email,
            subscriptionId: newSubscription.id,
            amount: upgradeData.amount,
            currency: upgradeData.currency,
          }
        });

        if (error) throw error;
        if (!data?.init_point) throw new Error('No se pudo generar el link de pago');
        await Linking.openURL(data.init_point);
      }
      
      return newSubscription;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          end_date: new Date().toISOString(),
        })
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .select()
        .maybeSingle();

      if (error) throw error;
      
      setSubscription(data);
      return data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          payment_date: new Date().toISOString(),
          last_modified: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      
      setPayments(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  };

  const applyPromoCode = async (promoCode: string) => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error || !data) {
        throw new Error('Código promocional inválido');
      }

      // Aplicar descuento
      const discountAmount = data.absolute_amount || 0;
      const commissionRate = data.commission_rate || 0;
      
      return {
        promoCode: data,
        discountAmount,
        commissionRate,
      };
    } catch (error) {
      console.error('Error applying promo code:', error);
      throw error;
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return 'none';
    
    const now = new Date();
    const endDate = subscription.end_date ? new Date(subscription.end_date) : null;
    const trialEndDate = subscription.trial_end_date ? new Date(subscription.trial_end_date) : null;
    
    if (trialEndDate && trialEndDate > now) {
      return 'trial';
    }
    
    if (subscription.status === 'active' && (!endDate || endDate > now)) {
      return 'active';
    }
    
    if (subscription.status === 'cancelled' || (endDate && endDate <= now)) {
      return 'cancelled';
    }
    
    if (subscription.status === 'pending') {
      return 'pending';
    }
    
    return subscription.status;
  };

  const isSubscriptionActive = () => {
    const status = getSubscriptionStatus();
    return status === 'active' || status === 'trial';
  };

  const getDaysUntilExpiration = () => {
    if (!subscription || !subscription.end_date) return null;
    
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const getPlanFeatures = (planType: string) => {
    const features = {
      basic: [
        'Registro básico de comidas',
        'Seguimiento de agua',
        'Estadísticas simples',
        'Hasta 50 comidas/mes',
      ],
      pro: [
        'Todo lo básico +',
        'Comidas ilimitadas',
        'Escáner de códigos de barras',
        'IA NotFat avanzada',
        'Estadísticas completas',
        'Logros y gamificación',
        'Integración con wearables',
        'Planes nutricionales personalizados',
        'Soporte prioritario',
      ],
      premium: [
        'Todo lo Pro +',
        'Consultas con nutricionistas',
        'Planes profesionales',
        'Análisis de sangre integrados',
        'Video consultas',
        'Reportes médicos',
        'API access',
        'Integración con equipos médicos',
      ],
    };
    
    return features[planType as keyof typeof features] || [];
  };

  return {
    subscription,
    payments,
    isLoading,
    fetchSubscription,
    fetchPayments,
    createSubscription,
    upgradeSubscription,
    cancelSubscription,
    createPayment,
    applyPromoCode,
    getSubscriptionStatus,
    isSubscriptionActive,
    getDaysUntilExpiration,
    getPlanFeatures,
  };
};
