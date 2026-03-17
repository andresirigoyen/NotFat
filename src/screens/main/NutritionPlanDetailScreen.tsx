import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUserNutritionGuidelines } from '@/hooks/useNutritionists';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

type RouteParams = {
  guidelineId: string;
};

export default function NutritionPlanDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { guidelineId } = route.params as RouteParams;
  const { data: guidelines } = useUserNutritionGuidelines(''); // guidelines are filtered client-side by id

  const guideline = guidelines?.find((g: any) => g.id === guidelineId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle del Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!guideline ? (
        <View style={styles.emptyState}>
          <Ionicons name="warning" size={40} color={COLORS.text.muted} />
          <Text style={styles.emptyText}>No se encontró el plan nutricional.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.planName}>{guideline.name}</Text>
            <Text style={styles.planStatus}>
              {guideline.status === 'draft' ? 'Borrador' : 'Activo'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            {guideline.allergies?.length > 0 && (
              <Text style={styles.infoText}>Alergias: {guideline.allergies.join(', ')}</Text>
            )}
            {guideline.pathologies?.length > 0 && (
              <Text style={styles.infoText}>Condiciones: {guideline.pathologies.join(', ')}</Text>
            )}
            {guideline.cooking_time && (
              <Text style={styles.infoText}>Tiempo de cocción: {guideline.cooking_time}</Text>
            )}
            {guideline.notes && (
              <Text style={styles.infoText}>Notas: {guideline.notes}</Text>
            )}
          </View>

          {guideline.guideline_days?.map((day: any) => (
            <View key={day.id} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day.day_name}</Text>
                {typeof day.total_calories === 'number' && (
                  <Text style={styles.dayCalories}>{day.total_calories} kcal</Text>
                )}
              </View>

              {day.guideline_meals?.map((meal: any) => (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{meal.meal_name}</Text>
                    {meal.scheduled_time && (
                      <Text style={styles.mealTime}>{meal.scheduled_time}</Text>
                    )}
                  </View>
                  {meal.guideline_meal_items?.map((item: any) => (
                    <View key={item.id} style={styles.mealItemRow}>
                      <Text style={styles.mealItemName}>{item.name}</Text>
                      <Text style={styles.mealItemMeta}>
                        {item.quantity ?? ''} {item.unit ?? ''} · {item.calories ?? 0} kcal
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    padding: SPACING.sm,
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  planName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  planStatus: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  dayCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dayTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  dayCalories: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
  },
  mealCard: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  mealName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  mealTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  mealItemRow: {
    marginTop: SPACING.xs,
  },
  mealItemName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  mealItemMeta: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.base,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
});

