import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useCreateMealWithItems } from '@/hooks/useMeals';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

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
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const route = useRoute<any>();
  const { imageUri, mealType = 'snack', mealDate } = route.params ?? {};
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [analyzing, setAnalyzing] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { analyzeMealImage } = useAIAnalysis();
  const { mutateAsync: createMeal } = useCreateMealWithItems();

  useEffect(() => {
    console.log('[AnalysisResult] Image URI:', imageUri);
    
    if (!imageUri || imageUri === 'undefined' || imageUri === 'null') {
      console.log('[AnalysisResult] No image URI, using mock data');
      setIngredients(MOCK_INGREDIENTS);
      setAnalyzing(false);
      return;
    }

    const analyzeImage = async () => {
      console.log('[AnalysisResult] Starting analysis...');
      try {
        const analysisResult = await analyzeMealImage(imageUri);
        console.log('[AnalysisResult] Analysis result:', JSON.stringify(analysisResult, null, 2));
        
        if (!analysisResult) {
          console.log('[AnalysisResult] No result returned, using mock data');
          setIngredients(MOCK_INGREDIENTS);
          return;
        }

        // Handle different response structures
        let ingredientsList = [];
        
        // Try different possible structures
        if (analysisResult.ingredients && Array.isArray(analysisResult.ingredients) && analysisResult.ingredients.length > 0) {
          ingredientsList = analysisResult.ingredients;
        } else if (analysisResult.name && (analysisResult.calories > 0)) {
          // Fallback: create ingredient from top-level data if ingredients array is empty or missing
          ingredientsList = [{
            name: analysisResult.name,
            calories: analysisResult.calories,
            protein: analysisResult.macros?.protein || analysisResult.protein || 0,
            carbs: analysisResult.macros?.carbs || analysisResult.carbs || 0,
            fat: analysisResult.macros?.fat || analysisResult.fat || 0,
          }];
        }

        console.log('[AnalysisResult] Ingredients list found:', ingredientsList.length);

        if (ingredientsList.length > 0) {
          const mappedIngredients = ingredientsList.map((ing: any, index: number) => ({
            id: index.toString(),
            name: ing.name || 'Ingrediente detectado',
            calories: Math.round(Number(ing.calories) || 0),
            protein: parseFloat(String(ing.protein || 0)).toFixed(1),
            carbs: parseFloat(String(ing.carbs || 0)).toFixed(1),
            fat: parseFloat(String(ing.fat || 0)).toFixed(1),
            confirmed: true,
          }));
          setIngredients(mappedIngredients as any);
        } else {
          console.log('[AnalysisResult] No ingredients found in response, using mock data');
          setIngredients(MOCK_INGREDIENTS);
        }
      } catch (error: any) {
        console.error('[AnalysisResult] Error analyzing image:', error);
        setIngredients(MOCK_INGREDIENTS);
      } finally {
        setAnalyzing(false);
      }
    };

    analyzeImage();
  }, [imageUri, analyzeMealImage]);

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

  const handleSaveMeal = async () => {
    if (confirmed.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos un ingrediente');
      return;
    }

    // Save in background without blocking UI
    createMeal({
      meal: {
        name: `Comida ${mealType}`,
        meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        source_type: 'camera' as const,
        status: 'complete' as const,
        meal_at: (mealDate && mealDate !== 'before') ? mealDate : new Date().toISOString(),
        image_url: imageUri,
        recorded_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        llm_used: 'gemini-2.0-flash' as const,
        modified: false,
        is_from_favorite: false,
        image_url_aux: null,
        feedback: null,
        recommendation: null,
        api_time_ms: null,
        processing_time_ms: null,
        prompt_version: '1.0',
      },
      items: confirmed.map(ing => ({
        name: ing.name,
        quantity: 100,
        unit: 'g' as const,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        barcode_number: null,
        scanned: false,
        servings: 1,
        contributed: false,
        nutriscore_grade: null,
        nova_group: null,
        notfat_score: null,
        labels_tags: null,
        additives_tags: null,
        notfat_score_breakdown: null,
        additives_details: null,
        is_alcoholic: false,
        has_ingredients_data: false,
      })),
    });

    // Navigate immediately, save happens in background
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        <Text style={styles.backLabel}>Resultado del análisis</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.photoBadgeRow}>
          <View style={styles.thumbnailContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.15)" />
                <Text style={styles.thumbnailLabel}>Foto analizada</Text>
              </View>
            )}
          </View>
          <View style={styles.aiChip}>
            <Ionicons name="sparkles" size={14} color={colors.primary.amber} />
            <Text style={styles.aiChipText}>Gemini Vision</Text>
          </View>
        </View>

        {analyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.amber} />
            <Text style={styles.loadingText}>Analizando imagen con IA...</Text>
          </View>
        ) : (
          <>
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
              <View style={styles.cardHeader}>
                <View style={[styles.checkbox, ing.confirmed && styles.checkboxChecked]}>
                  {ing.confirmed && <Ionicons name="checkmark" size={12} color={colors.background.primary} />}
                </View>
                <Text style={styles.macroKcal}>🔥 {ing.calories}</Text>
              </View>

              <View style={styles.ingredientInfo}>
                <Text 
                  style={[styles.ingredientName, !ing.confirmed && { color: colors.text.secondary }]}
                  numberOfLines={1}
                >
                  {ing.name}
                </Text>
                <View style={styles.macroGrid}>
                  <Text style={styles.macroMini}>P: {ing.protein}g</Text>
                  <Text style={styles.macroMini}>C: {ing.carbs}g</Text>
                  <Text style={styles.macroMini}>G: {ing.fat}g</Text>
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
          </>
        )}
      </ScrollView>

      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleSaveMeal}
          disabled={saving || analyzing}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background.primary} />
          ) : (
            <Ionicons name="checkmark-circle" size={22} color={colors.background.primary} />
          )}
          <Text style={styles.confirmButtonText}>
            {saving ? 'Guardando...' : 'Confirmar y Guardar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, gap: SPACING.sm },
  backLabel: { color: colors.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.base, fontWeight: '600' },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: 120 },
  photoBadgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.lg, marginBottom: SPACING.xl },
  thumbnailContainer: { width: '28%', aspectRatio: 1, maxWidth: 120, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.xl },
  thumbnailPlaceholder: { width: '100%', aspectRatio: 1, maxWidth: 120, backgroundColor: colors.background.card, borderRadius: BORDER_RADIUS.xl, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', gap: 6 },
  thumbnailLabel: { color: colors.text.secondary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.xs },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: SPACING.lg * 2,
    gap: SPACING.md 
  },
  loadingText: { 
    color: colors.text.secondary, 
    fontFamily: FONTS.primary, 
    fontSize: FONTS.sizes.base,
    textAlign: 'center',
    marginTop: SPACING.md 
  },
  aiChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(252,211,77,0.1)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: 6, borderWidth: 1, borderColor: 'rgba(252,211,77,0.25)', alignSelf: 'flex-start' },
  aiChipText: { color: colors.primary.amber, fontFamily: FONTS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  sectionTitle: { color: colors.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.xl, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: colors.text.secondary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.lg },
  ingredientsList: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    rowGap: SPACING.md, 
    marginBottom: SPACING.xl 
  },
  ingredientCard: { 
    width: '48.5%', 
    backgroundColor: colors.background.card, 
    borderRadius: BORDER_RADIUS.xl, 
    padding: SPACING.md, 
    borderWidth: 1, 
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    gap: SPACING.xs
  },
  ingredientCardUnchecked: { opacity: 0.45 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: colors.primary.amber, borderColor: colors.primary.amber },
  ingredientInfo: { flex: 1, gap: 2 },
  ingredientName: { color: colors.text.primary, fontFamily: FONTS.primary, fontSize: 13, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  macroKcal: { fontSize: 11, fontWeight: '700', color: colors.text.secondary },
  macroGrid: { gap: 1 },
  macroMini: { fontSize: 10, color: colors.text.tertiary, fontFamily: FONTS.primary },
  macroRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  macro: { fontSize: FONTS.sizes.xs, color: colors.text.secondary, fontFamily: FONTS.primary },
  summaryCard: { backgroundColor: '#111', borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(252,211,77,0.15)' },
  summaryTitle: { color: colors.text.secondary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBlock: { alignItems: 'center', flex: 1 },
  summaryNumber: { color: colors.primary.amber, fontFamily: FONTS.primary, fontWeight: '800', fontSize: FONTS.sizes['2xl'] },
  summaryLabel: { color: colors.text.secondary, fontFamily: FONTS.primary, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.xl, paddingBottom: SPACING['3xl'], backgroundColor: colors.background.primary, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' },
  confirmButton: { backgroundColor: colors.primary.amber, borderRadius: BORDER_RADIUS.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  confirmButtonText: { color: colors.background.primary, fontFamily: FONTS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },
});
