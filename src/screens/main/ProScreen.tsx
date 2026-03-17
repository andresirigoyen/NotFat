import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';

const ProScreen = ({ navigation }: any) => {
  const { profile, nutritionGoals } = useProfile();

  // Generate dynamic motivational message based on user goals
  const getMotivationalMessage = () => {
    if (!profile || !nutritionGoals) {
      return "¡Alcanza tus metas de salud con NotFat Pro!";
    }

    const targetWeight = nutritionGoals.target_weight || profile.weight_value || 70;
    const goalType = nutritionGoals.goal_type || profile.nutrition_goal || 'maintain';
    
    // Calculate target date (3 months from now as example)
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3);
    const formattedDate = targetDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long' 
    });

    if (goalType === 'lose_weight') {
      return `Te ayudaremos a perder peso para alcanzar ${targetWeight.toFixed(1)} kg antes del ${formattedDate}!`;
    } else if (goalType === 'gain_muscle') {
      return `Te ayudaremos a construir músculo para alcanzar ${targetWeight.toFixed(1)} kg antes del ${formattedDate}!`;
    } else if (goalType === 'maintain') {
      return `Te ayudaremos a mantener tu peso ideal de ${targetWeight.toFixed(1)} kg y mejorar tu salud!`;
    }
    
    return `¡Alcanza tus metas de salud con NotFat Pro!`;
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Monster Illustration Section */}
        <View style={styles.monsterSection}>
          <View style={styles.monsterContainer}>
            {/* Logo */}
            <Image 
              source={require('../../../assets/images/NotFat.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            {/* Floating food items */}
            <View style={[styles.floatingItem, { top: 20, left: 20 }]}>
              <Text style={styles.foodEmoji}>🍎</Text>
            </View>
            <View style={[styles.floatingItem, { top: 40, right: 30 }]}>
              <Text style={styles.foodEmoji}>🥕</Text>
            </View>
            <View style={[styles.floatingItem, { bottom: 60, left: 40 }]}>
              <Text style={styles.foodEmoji}>🥦</Text>
            </View>
            <View style={[styles.floatingItem, { bottom: 30, right: 50 }]}>
              <Text style={styles.foodEmoji}>🧀</Text>
            </View>
            {/* Stars */}
            <View style={[styles.floatingItem, { top: 10, right: 60 }]}>
              <Text style={styles.starEmoji}>⭐</Text>
            </View>
            <View style={[styles.floatingItem, { top: 50, left: 60 }]}>
              <Text style={styles.starEmoji}>⭐</Text>
            </View>
          </View>
        </View>

        {/* Motivational Text */}
        <View style={styles.motivationSection}>
          <Text style={styles.motivationText}>
            {getMotivationalMessage()}
          </Text>
        </View>

          {/* Subscription Options */}
        <View style={styles.subscriptionOptions}>
          {/* 12 Months - Most Popular */}
          <View style={[styles.subscriptionCard, styles.popularCard]}>
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Más popular</Text>
            </View>
            <Text style={styles.subscriptionTitle}>12 meses</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>45.000 CLP</Text>
              <Text style={styles.discountedPrice}>29.990 CLP</Text>
            </View>
            <Text style={styles.monthlyPrice}>2.499 CLP/mes</Text>
          </View>

          {/* Mensual */}
          <View style={styles.subscriptionCard}>
            <Text style={styles.subscriptionTitle}>1 mes</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.discountedPrice}>4.990 CLP</Text>
            </View>
            <Text style={styles.monthlyPrice}>Renovación mensual</Text>
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialsScroll}>
            <View style={styles.testimonialCard}>
              <View style={styles.stars}>
                <Text style={styles.star}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.testimonialText}>
                "¡La mejor aplicación para contar calorías en el mercado! ¡Sencilla y fácil de usar!"
              </Text>
            </View>
            <View style={styles.testimonialCard}>
              <View style={styles.stars}>
                <Text style={styles.star}>⭐⭐⭐⭐⭐</Text>
              </View>
              <Text style={styles.testimonialText}>
                "¡Resultados increíbles en solo 2 meses. ¡Muy recomendado!"
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.cancelLink}>
            <Text style={styles.cancelText}>Cancelar en cualquier momento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  subscriptionContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  annualCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  priceHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  features: {
    marginBottom: 20,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
    textAlign: 'center',
  },
  // Monster Section
  monsterSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  monsterContainer: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  logoImage: {
    width: 80,
    height: 80,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  floatingItem: {
    position: 'absolute',
    backgroundColor: COLORS.background.card,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEmoji: {
    fontSize: 16,
  },
  starEmoji: {
    fontSize: 12,
  },
  // Motivation Section
  motivationSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  motivationText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: FONTS.primary,
  },
  // Subscription Options
  subscriptionOptions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  subscriptionCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.background.border,
  },
  popularCard: {
    borderColor: '#10B981', // Green color for popular
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.primary,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 12,
    fontFamily: FONTS.primary,
  },
  priceContainer: {
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textDecorationLine: 'line-through',
    marginBottom: 4,
    fontFamily: FONTS.primary,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  monthlyPrice: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  // Testimonials
  testimonialsSection: {
    marginBottom: 32,
  },
  testimonialsScroll: {
    paddingHorizontal: 24,
  },
  testimonialCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    width: 280,
  },
  stars: {
    marginBottom: 12,
  },
  star: {
    fontSize: 14,
    fontFamily: FONTS.primary,
  },
  testimonialText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
    fontFamily: FONTS.primary,
  },
  // Bottom Actions
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cancelLink: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  cancelText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textDecorationLine: 'underline',
    fontFamily: FONTS.primary,
  },
  continueButton: {
    backgroundColor: COLORS.primary.amber,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background.primary,
    fontFamily: FONTS.primary,
  },
});

export default ProScreen;
