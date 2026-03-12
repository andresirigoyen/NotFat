import { useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store';
// Fallback if react-native-purchases is not installed
const Purchases: any = {
  configure: async () => {},
  getOfferings: async () => ({ current: null }),
  purchaseProduct: async () => ({ customerInfo: { entitlements: {} } }),
  restoreTransactions: async () => ({ entitlements: {} }),
  getCustomerInfo: async () => ({ entitlements: {} }),
};

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: 'monthly' | 'annual';
  features: string[];
  trialDays?: number;
  productId: string;
}

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const plans: PaymentPlan[] = [
    {
      id: 'monthly',
      name: 'Nutria Mensual',
      price: 4990,
      currency: 'CLP',
      duration: 'monthly',
      trialDays: 3,
      productId: 'com.nutriahealth.app.Monthly',
      features: [
        'Análisis IA ilimitado',
        'Seguimiento nutricional completo',
        'Recetas personalizadas',
        'Estadísticas avanzadas',
        'Sin anuncios'
      ]
    },
    {
      id: 'annual',
      name: 'Nutria Anual',
      price: 29990,
      currency: 'CLP',
      duration: 'annual',
      trialDays: 3,
      productId: 'com.nutriahealth.app.Annual',
      features: [
        'Todo lo mensual +',
        'Ahorro de 50%',
        'Coaching personalizado',
        'Prioridad en soporte'
      ]
    }
  ];

  const initializePurchases = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Purchases.configure({
          apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY!,
          userIdentifier: user?.id
        });
      }
    } catch (err) {
      console.error('Error initializing Purchases:', err);
    }
  };

  const purchasePlan = async (plan: PaymentPlan) => {
    if (!user) {
      setError('Debes estar autenticado para comprar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (Platform.OS === 'ios') {
        const offerings = await Purchases.getOfferings();
        const offering = offerings.current;
        
        if (!offering) {
          throw new Error('No hay ofertas disponibles');
        }

        const productToPurchase = offering.products.find(
          (product: any) => product.identifier === plan.productId
        );

        if (!productToPurchase) {
          throw new Error('Producto no encontrado');
        }

        const { customerInfo } = await Purchases.purchaseProduct(
          productToPurchase.identifier
        );

        // Update subscription status in database
        await updateSubscriptionStatus(customerInfo);

      } else {
        // MercadoPago flow for Android/web
        await initiateMercadoPagoPayment(plan);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      console.error('Purchase error:', err);
    } finally {
      setLoading(false);
    }
  };

  const initiateMercadoPagoPayment = async (plan: PaymentPlan) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-mp-preference', {
        body: {
          planId: plan.id,
          userId: user?.id,
          amount: plan.price,
          currency: plan.currency
        }
      });

      if (error) throw error;

      // Open MercadoPago checkout
      if (data?.preferenceId) {
        // In a real app, you would open the MercadoPago checkout here
        console.log('MercadoPago preference ID:', data.preferenceId);
      }
    } catch (err: any) {
      throw new Error('Error al iniciar pago con MercadoPago');
    }
  };

  const updateSubscriptionStatus = async (customerInfo: any) => {
    try {
      const entitlementId = Object.keys(customerInfo.entitlements)[0];
      const entitlement = customerInfo.entitlements[entitlementId];

      await supabase
        .from('subscriptions')
        .upsert({
          user_id: user!.id,
          status: entitlement.isActive ? 'active' : 'expired',
          ends_at: entitlement.expirationDate 
            ? new Date(entitlement.expirationDate).toISOString() 
            : null,
          revenuecat_customer_id: customerInfo.customerId,
          revenuecat_entitlement_id: entitlementId
        });
    } catch (err) {
      console.error('Error updating subscription status:', err);
    }
  };

  const restorePurchases = async () => {
    setLoading(true);
    try {
      const customerInfo = await Purchases.restoreTransactions();
      await updateSubscriptionStatus(customerInfo);
    } catch (err: any) {
      setError(err.message || 'Error al restaurar compras');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      if (Platform.OS === 'ios') {
        const customerInfo = await Purchases.getCustomerInfo();
        const entitlementId = Object.keys(customerInfo.entitlements)[0];
        const entitlement = customerInfo.entitlements[entitlementId];
        
        return {
          isActive: entitlement?.isActive || false,
          expirationDate: entitlement?.expirationDate || null
        };
      } else {
        // Check database for Android/web
        const { data } = await supabase
          .from('subscriptions')
          .select('status, ends_at')
          .eq('user_id', user?.id)
          .single();

        return {
          isActive: data?.status === 'active',
          expirationDate: data?.ends_at
        };
      }
    } catch (err) {
      console.error('Error checking subscription status:', err);
      return { isActive: false, expirationDate: null };
    }
  };

  return {
    plans,
    purchasePlan,
    restorePurchases,
    checkSubscriptionStatus,
    initializePurchases,
    loading,
    error
  };
};
