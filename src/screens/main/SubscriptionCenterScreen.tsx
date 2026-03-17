import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useSubscriptionEnhanced, Payment, Subscription } from '@/hooks/useSubscriptionEnhanced';
import { analytics } from '@/services/analytics';
import { useAuthStore } from '@/store';

const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: 0,
    currency: 'CLP',
    period: 'mes',
    features: [
      'Registro básico de comidas',
      'Seguimiento de agua',
      'Estadísticas simples',
      'Hasta 50 comidas/mes',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4990,
    currency: 'CLP',
    period: 'mes',
    features: [
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
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19990,
    currency: 'CLP',
    period: 'mes',
    features: [
      'Todo lo Pro +',
      'Consultas con nutricionistas',
      'Planes profesionales',
      'Análisis de sangre integrados',
      'Video consultas',
      'Reportes médicos',
      'API access',
      'Integración con equipos médicos',
    ],
    popular: false,
  },
];

const PAYMENT_METHODS = [
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    icon: 'card-outline',
    description: 'Tarjetas de crédito y débito chilenas',
  },
  {
    id: 'webpay',
    name: 'WebPay',
    icon: 'globe-outline',
    description: 'Transferencias bancarias',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'card-outline',
    description: 'Tarjetas internacionales',
  },
];

export default function SubscriptionCenterScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const { 
    subscription, 
    payments, 
    upgradeSubscription, 
    cancelSubscription, 
    isLoading,
    createPayment,
    getSubscriptionStatus,
    isSubscriptionActive,
    getDaysUntilExpiration,
    getPlanFeatures,
    fetchSubscription,
    fetchPayments,
  } = useSubscriptionEnhanced();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mercadopago');
  const [promoCode, setPromoCode] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    const result = route.params?.result;
    if (!result) return;

    if (result === 'success') {
      Alert.alert('Pago aprobado', 'Tu suscripción se activará en unos segundos.');
    } else if (result === 'pending') {
      Alert.alert('Pago pendiente', 'Tu pago está pendiente. Te avisaremos cuando se apruebe.');
    } else if (result === 'failure') {
      Alert.alert('Pago rechazado', 'No se pudo completar el pago. Intenta nuevamente.');
    }

    // Refresh local state
    fetchSubscription();
    fetchPayments();
  }, [route.params?.result]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    const plan = PLANS.find(p => p.id === planId);
    analytics.trackCustomEvent('Paywall Plan Selected', {
      plan_id: planId,
      price: plan?.price,
      currency: plan?.currency,
    });
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Debes seleccionar un plan');
      return;
    }

    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      if (!plan) return;

      analytics.trackPaymentAttempt({
        plan_id: selectedPlan,
        amount: plan.price,
        currency: plan.currency,
        payment_method: selectedPaymentMethod,
        promo_code: promoCode || undefined,
        source: 'subscription_center',
      });

      await upgradeSubscription({
        planType: plan.id,
        amount: plan.price,
        currency: plan.currency,
        paymentMethod: selectedPaymentMethod,
        promoCode: promoCode || undefined,
      });
      analytics.trackSubscriptionStarted({
        plan_id: selectedPlan,
        amount: plan.price,
        currency: plan.currency,
        payment_method: selectedPaymentMethod,
        source: 'subscription_center',
      });
    } catch (error: any) {
      analytics.trackPaymentFailed({
        plan_id: selectedPlan,
        payment_method: selectedPaymentMethod,
        error_message: error?.message,
        source: 'subscription_center',
      });
      Alert.alert('Error', 'No se pudo procesar la suscripción');
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancelar Suscripción',
      '¿Estás seguro que deseas cancelar tu suscripción? Perderás acceso a todas las características Pro.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert('Éxito', 'Tu suscripción ha sido cancelada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la suscripción');
            }
          }
        },
      ]
    );
  };

  const currentPlan = subscription?.plan_type || 'basic';
  const isSubscribed = subscription?.status === 'active';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Centro de Suscripciones</Text>
          <Text style={styles.subtitle}>Desbloquea todo el potencial de NotFat</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Subscription Status */}
        {isSubscribed && (
          <View style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <View style={styles.currentPlanInfo}>
                <Text style={styles.currentPlanTitle}>Plan Actual</Text>
                <Text style={styles.currentPlanName}>
                  {PLANS.find(p => p.id === currentPlan)?.name}
                </Text>
                <Text style={styles.currentPlanStatus}>
                  {subscription?.status === 'active' ? 'Activo' : subscription?.status}
                </Text>
              </View>
              <View style={styles.currentPlanBadge}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.amber} />
              </View>
            </View>
            
            <View style={styles.currentPlanDetails}>
              <Text style={styles.currentPlanPrice}>
                ${subscription?.amount?.toLocaleString()} {subscription?.currency}
              </Text>
              <Text style={styles.currentPlanPeriod}>
                Renovación: {subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString('es-ES') : 'N/A'}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelBtnText}>Cancelar Suscripción</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Available Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isSubscribed ? 'Cambiar de Plan' : 'Planes Disponibles'}
          </Text>
          
          {PLANS.filter(plan => !isSubscribed || plan.id !== currentPlan).map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.popular && styles.planCardPopular,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString()} ${plan.currency}`}
                  </Text>
                  <Text style={styles.planPeriod}>/{plan.period}</Text>
                </View>
                <View style={styles.planSelection}>
                  {selectedPlan === plan.id ? (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary.amber} />
                  ) : (
                    <View style={styles.planRadio} />
                  )}
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons 
                      name="checkmark-outline" 
                      size={16} 
                      color={selectedPlan === plan.id ? COLORS.primary.amber : COLORS.text.secondary} 
                    />
                    <Text style={[
                      styles.featureText,
                      selectedPlan === plan.id && styles.featureTextSelected
                    ]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Código Promocional</Text>
          <View style={styles.promoCodeContainer}>
            <TextInput
              style={styles.promoCodeInput}
              placeholder="Ingresa tu código promocional"
              value={promoCode}
              onChangeText={setPromoCode}
              placeholderTextColor={COLORS.text.secondary}
            />
            <TouchableOpacity 
              style={styles.applyPromoBtn}
              onPress={() => {
                // Lógica para aplicar código promocional
                Alert.alert('Código Aplicado', 'El descuento ha sido aplicado exitosamente');
              }}
            >
              <Text style={styles.applyPromoBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        {(() => {
          const plan = selectedPlan ? PLANS.find(p => p.id === selectedPlan) : undefined;
          return plan && plan.price > 0;
        })() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedPaymentMethod === method.id && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <View style={styles.paymentMethodHeader}>
                  <View style={styles.paymentMethodIcon}>
                    <Ionicons name={method.icon as any} size={24} color={COLORS.text.primary} />
                  </View>
                  <View style={styles.paymentMethodInfo}>
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                    <Text style={styles.paymentMethodDescription}>{method.description}</Text>
                  </View>
                  <View style={styles.paymentMethodSelection}>
                    {selectedPaymentMethod === method.id ? (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary.amber} />
                    ) : (
                      <View style={styles.paymentMethodRadio} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subscribe Button */}
        {selectedPlan && (
          <TouchableOpacity 
            style={styles.subscribeBtn}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.subscribeBtnText}>Procesando...</Text>
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.text.primary} />
                <Text style={styles.subscribeBtnText}>
                  {PLANS.find(p => p.id === selectedPlan)?.price === 0 
                    ? 'Comenzar Gratis' 
                    : `Suscribirse por $${PLANS.find(p => p.id === selectedPlan)?.price?.toLocaleString()}`
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de Pagos</Text>
            
            {payments.slice(0, 5).map((payment: Payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.payment_date).toLocaleDateString('es-ES')}
                  </Text>
                  <Text style={styles.paymentAmount}>
                    ${payment.amount.toLocaleString()} {payment.currency}
                  </Text>
                  <Text style={styles.paymentStatus}>
                    {payment.status === 'approved' ? 'Aprobado' : payment.status}
                  </Text>
                </View>
                <View style={[
                  styles.paymentStatusBadge,
                  payment.status === 'approved' && styles.paymentStatusSuccess
                ]}>
                  <Ionicons 
                    name={payment.status === 'approved' ? 'checkmark-circle' : 'time-outline'} 
                    size={16} 
                    color={COLORS.text.primary} 
                  />
                </View>
              </View>
            ))}
            
            {payments.length > 5 && (
              <TouchableOpacity style={styles.viewAllPaymentsBtn}>
                <Text style={styles.viewAllPaymentsBtnText}>Ver todos los pagos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Benefits Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparación de Beneficios</Text>
          
          <View style={styles.comparisonTable}>
            <View style={styles.comparisonHeader}>
              <Text style={styles.comparisonCell}>Característica</Text>
              <Text style={styles.comparisonCell}>Básico</Text>
              <Text style={styles.comparisonCell}>Pro</Text>
              <Text style={styles.comparisonCell}>Premium</Text>
            </View>
            
            {[
              { feature: 'Comidas/mes', basic: '50', pro: '∞', premium: '∞' },
              { feature: 'IA NotFat', basic: 'Básica', pro: 'Avanzada', premium: 'Experta' },
              { feature: 'Wearables', basic: '❌', pro: '✅', premium: '✅' },
              { feature: 'Nutricionista', basic: '❌', pro: '❌', premium: '✅' },
              { feature: 'Soporte', basic: 'Email', pro: 'Prioritario', premium: 'Dedicado' },
            ].map((row, index) => (
              <View key={index} style={styles.comparisonRow}>
                <Text style={styles.comparisonCell}>{row.feature}</Text>
                <Text style={styles.comparisonCell}>{row.basic}</Text>
                <Text style={styles.comparisonCell}>{row.pro}</Text>
                <Text style={styles.comparisonCell}>{row.premium}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  currentPlanCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.primary.amber,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  currentPlanInfo: {
    flex: 1,
  },
  currentPlanTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  currentPlanName: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  currentPlanStatus: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.sky,
    backgroundColor: COLORS.primary.sky + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },
  currentPlanBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary.amber + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPlanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentPlanPrice: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary.amber,
  },
  currentPlanPeriod: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  cancelBtnText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  planCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: COLORS.primary.amber,
  },
  planCardPopular: {
    borderColor: COLORS.primary.sky,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.lg,
    backgroundColor: COLORS.primary.sky,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  popularBadgeText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planName: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
  },
  planPrice: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes['2xl'],
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary.amber,
  },
  planPeriod: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
  },
  planSelection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.text.secondary,
  },
  planFeatures: {
    marginTop: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  featureTextSelected: {
    color: COLORS.text.primary,
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCodeInput: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.background.border,
    marginRight: SPACING.md,
  },
  applyPromoBtn: {
    backgroundColor: COLORS.primary.sky,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  applyPromoBtnText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
  paymentMethodCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodSelected: {
    borderColor: COLORS.primary.amber,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  paymentMethodName: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
  paymentMethodDescription: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  paymentMethodSelection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.text.secondary,
  },
  subscribeBtn: {
    backgroundColor: COLORS.primary.amber,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
  },
  subscribeBtnText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  paymentAmount: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
  },
  paymentStatus: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
  },
  paymentStatusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentStatusSuccess: {
    backgroundColor: '#34D399',
  },
  viewAllPaymentsBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  viewAllPaymentsBtnText: {
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.sky,
  },
  comparisonTable: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.tertiary,
    paddingVertical: SPACING.sm,
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.border,
  },
  comparisonCell: {
    flex: 1,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
});
