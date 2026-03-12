import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

type Ingredient = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confirmed: boolean;
};

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Pechuga de pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6, confirmed: true },
  { id: '2', name: 'Arroz blanco', calories: 200, protein: 4.3, carbs: 44, fat: 0.4, confirmed: true },
  { id: '3', name: 'Aceite de oliva', calories: 120, protein: 0, carbs: 0, fat: 14, confirmed: true },
  { id: '4', name: 'Tomate cherry', calories: 35, protein: 1.7, carbs: 7.6, fat: 0.4, confirmed: false },
];

export default function AnalysisResultScreen() {
  const navigation = useNavigation();
  const [ingredients, setIngredients] = useState<Ingredient[]>(MOCK_INGREDIENTS);

  const toggleIngredient = (id: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, confirmed: !i.confirmed } : i))
    );
  };

  const confirmed = ingredients.filter((i) => i.confirmed);
  const totalCalories = confirmed.reduce((sum, i) => sum + i.calories, 0);
  const totalProtein = confirmed.reduce((sum, i) => sum + i.protein, 0);
  const totalCarbs = confirmed.reduce((sum, i) => sum + i.carbs, 0);
  const totalFat = confirmed.reduce((sum, i) => sum + i.fat, 0);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
        <Text style={styles.backLabel}>Resultado del análisis</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoBadgeRow}>
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.15)" />
            <Text style={styles.thumbnailLabel}>Foto analizada</Text>
          </View>
          <View style={styles.aiChip}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary.amber} />
            <Text style={styles.aiChipText}>Gemini Vision</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ingredientes detectados</Text>
        <Text style={styles.sectionSub}>Confirma o descarta lo que Gemini identificó</Text>

        <View style={styles.ingredientsList}>
          {ingredients.map((ing) => (
            <TouchableOpacity
              key={ing.id}
              style={[styles.ingredientCard, !ing.confirmed && styles.ingredientCardUnchecked]}
              onPress={() => toggleIngredient(ing.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, ing.confirmed && styles.checkboxChecked]}>
                {ing.confirmed && <Ionicons name="checkmark" size={14} color={COLORS.background.primary} />}
              </View>
              <View style={styles.ingredientInfo}>
                <Text style={[styles.ingredientName, !ing.confirmed && { color: COLORS.text.secondary }]}>
                  {ing.name}
                </Text>
                <View style={styles.macroRow}>
                  <Text style={styles.macro}>🔥 {ing.calories} kcal</Text>
                  <Text style={styles.macro}>P: {ing.protein}g</Text>
                  <Text style={styles.macro}>C: {ing.carbs}g</Text>
                  <Text style={styles.macro}>G: {ing.fat}g</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen total ({confirmed.length} ingredientes)</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryNumber}>{totalCalories}</Text>
              <Text style={styles.summaryLabel}>kcal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryNumber}>{totalProtein.toFixed(0)}g</Text>
              <Text style={styles.summaryLabel}>Proteína</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryNumber}>{totalCarbs.toFixed(0)}g</Text>
              <Text style={styles.summaryLabel}>Carbos</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBlock}>
              <Text style={styles.summaryNumber}>{totalFat.toFixed(0)}g</Text>
              <Text style={styles.summaryLabel}>Grasas</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => (navigation.navigate as any)('Main')}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={22} color={COLORS.background.primary} />
          <Text style={styles.confirmButtonText}>Confirmar y Guardar en Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, gap: SPACING.sm },
  backLabel: { color: COLORS.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: 120 },
  photoBadgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.lg, marginBottom: SPACING.xl },
  thumbnailPlaceholder: { width: 110, height: 110, backgroundColor: '#1A1A1A', borderRadius: BORDER_RADIUS.xl, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 6 },
  thumbnailLabel: { color: COLORS.text.secondary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.xs },
  aiChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(252,211,77,0.1)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: 6, borderWidth: 1, borderColor: 'rgba(252,211,77,0.25)', alignSelf: 'flex-start' },
  aiChipText: { color: COLORS.primary.amber, fontFamily: FONTS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  sectionTitle: { color: COLORS.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.xl, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: COLORS.text.secondary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.lg },
  ingredientsList: { gap: SPACING.sm, marginBottom: SPACING.xl },
  ingredientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  ingredientCardUnchecked: { opacity: 0.45 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary.amber, borderColor: COLORS.primary.amber },
  ingredientInfo: { flex: 1, gap: 4 },
  ingredientName: { color: COLORS.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  macro: { fontSize: FONTS.sizes.xs, color: COLORS.text.secondary, fontFamily: FONTS.primary },
  summaryCard: { backgroundColor: '#111', borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(252,211,77,0.15)' },
  summaryTitle: { color: COLORS.text.secondary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBlock: { alignItems: 'center', flex: 1 },
  summaryNumber: { color: COLORS.primary.amber, fontFamily: FONTS.primary, fontWeight: '800', fontSize: FONTS.sizes['2xl'] },
  summaryLabel: { color: COLORS.text.secondary, fontFamily: FONTS.primary, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.06)' },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.xl, paddingBottom: SPACING['3xl'], backgroundColor: COLORS.background.primary, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  confirmButton: { backgroundColor: COLORS.primary.amber, borderRadius: BORDER_RADIUS.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  confirmButtonText: { color: COLORS.background.primary, fontFamily: FONTS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },
});
