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
  const { imageUri, mealType = 'snack', mealDate, barcodeProduct, source } = route.params ?? {};
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [analyzing, setAnalyzing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  
  const { analyzeMealImage } = useAIAnalysis();
  const { mutateAsync: createMeal } = useCreateMealWithItems();

  useEffect(() => {
    // Si venimos de un código de barras, ya tenemos los datos
    if (barcodeProduct) {
      console.log('[AnalysisResult] Using barcode product data');
      const mappedIngredient: Ingredient = {
        id: '0',
        name: barcodeProduct.name || 'Producto Escaneado',
        calories: Math.round(Number(barcodeProduct.calories) || 0),
        protein: parseFloat(String(barcodeProduct.protein || 0)).toFixed(1) as any,
        carbs: parseFloat(String(barcodeProduct.carbs || 0)).toFixed(1) as any,
        fat: parseFloat(String(barcodeProduct.fat || 0)).toFixed(1) as any,
        confirmed: true,
      };
      setIngredients([mappedIngredient]);
      setAnalyzing(false);
      return;
    }

    console.log('[AnalysisResult] Image URI:', imageUri);
    
    if (!imageUri || imageUri === 'undefined' || imageUri === 'null') {
      setAnalyzing(false);
      setErrorHeader('No se proporcionó ninguna imagen para analizar.');
      return;
    }

    const analyzeImage = async () => {
      console.log('[AnalysisResult] Starting analysis...');
      try {
        const analysisResult = await analyzeMealImage(imageUri);
        console.log('[AnalysisResult] Analysis result:', JSON.stringify(analysisResult, null, 2));
        
        if (!analysisResult) {
          throw new Error('La IA no pudo procesar la imagen correctamente.');
        }

        // Handle spatial structure from our updated prompt
        let ingredientsList = [];
        
        if (analysisResult.ingredients && Array.isArray(analysisResult.ingredients)) {
          ingredientsList = analysisResult.ingredients;
        } else if (analysisResult.name) {
          ingredientsList = [{
            name: analysisResult.name,
            calories: analysisResult.calories,
            protein: analysisResult.protein || 0,
            carbs: analysisResult.carbs || 0,
            fat: analysisResult.fat || 0,
            box_2d: analysisResult.box_2d
          }];
        }

        if (ingredientsList.length > 0) {
          const mappedIngredients = ingredientsList.map((ing: any, index: number) => ({
            id: `ing-${index}-${Date.now()}`,
            name: ing.name || 'Ingrediente detectado',
            calories: Math.round(Number(ing.calories) || 0),
            protein: parseFloat(String(ing.protein || 0)).toFixed(1),
            carbs: parseFloat(String(ing.carbs || 0)).toFixed(1),
            fat: parseFloat(String(ing.fat || 0)).toFixed(1),
            confirmed: true,
            box_2d: ing.box_2d
          }));
          setIngredients(mappedIngredients as any);
        } else {
          throw new Error('No se detectaron ingredientes en la imagen.');
        }
      } catch (error: any) {
        console.error('[AnalysisResult] Error analyzing image:', error);
        setErrorHeader(error.message || 'Error al conectar con el motor de IA.');
      } finally {
        setAnalyzing(false);
      }
    };

    analyzeImage();
  }, [imageUri, barcodeProduct, analyzeMealImage]);

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
        <Text style={styles.backLabel}>
          {source === 'barcode' ? 'Producto escaneado' : 'Resultado del análisis'}
        </Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {errorHeader && !analyzing ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={colors.status.error} />
            <Text style={styles.errorTitle}>¡Vaya! Algo no salió bien</Text>
            <Text style={styles.errorText}>{errorHeader}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Volver a intentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.photoContainer}>
              {imageUri ? (
                <View style={styles.mainImageWrapper}>
                  <Image source={{ uri: imageUri }} style={styles.mainImage} resizeMode="cover" />
                  
                  {/* Overlay de Etiquetas Espaciales (Solo si no está analizando) */}
                  {!analyzing && ingredients.map((ing: any) => {
                    if (!ing.box_2d || !ing.confirmed) return null;
                    
                    // Gemini devuelve [ymin, xmin, ymax, xmax] de 0-1000
                    const [ymin, xmin, ymax, xmax] = ing.box_2d;
                    const top = `${ymin / 10}%`;
                    const left = `${xmin / 10}%`;
                    
                    return (
                      <View 
                        key={`badge-${ing.id}`}
                        style={[styles.spatialBadge, { top, left } as any]}
                      >
                        <View style={styles.badgeLine} />
                        <View style={styles.badgeContent}>
                          <Text style={styles.badgeKcal}>{ing.calories} kcal</Text>
                          <View style={styles.badgeMacros}>
                            <Text style={styles.badgeMacroText}>P: {ing.protein}g</Text>
                            <View style={styles.badgeDot} />
                            <Text style={styles.badgeMacroText}>C: {ing.carbs}g</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {analyzing && (
                    <View style={styles.scanningOverlay}>
                      <View style={styles.scanningLine} />
                    </View>
                  )}
                </View>
              ) : barcodeProduct?.image_url ? (
                <Image source={{ uri: barcodeProduct.image_url }} style={styles.mainImage} resizeMode="contain" />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons 
                    name={source === 'barcode' ? "barcode-outline" : "image-outline"} 
                    size={80} 
                    color="rgba(255,255,255,0.1)" 
                  />
                </View>
              )}

              <View style={[
                styles.aiChipFloating, 
                source === 'barcode' && { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)' }
              ]}>
                <Ionicons 
                  name={source === 'barcode' ? "barcode" : "sparkles"} 
                  size={14} 
                  color={source === 'barcode' ? colors.status.info : colors.primary.amber} 
                />
                <Text style={[
                  styles.aiChipText, 
                  source === 'barcode' && { color: colors.status.info }
                ]}>
                  {source === 'barcode' ? 'Open Food Facts' : 'Gemini 2.0 Flash'}
                </Text>
              </View>
            </View>

            {analyzing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.amber} />
                <Text style={styles.loadingText}>Escaneando estructura nutricional...</Text>
              </View>
            ) : (
              <>
                <View style={styles.resultHeader}>
                  <Text style={styles.sectionTitle}>Identificación Exacta</Text>
                  <Text style={styles.sectionSub}>Hemos detectado {ingredients.length} componentes nutricionales</Text>
                </View>

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
                        <Text style={styles.macroKcal}>🔥 {ing.calories} kcal</Text>
                      </View>

                      <View style={styles.ingredientInfo}>
                        <Text 
                          style={[styles.ingredientName, !ing.confirmed && { color: colors.text.secondary }]}
                          numberOfLines={1}
                        >
                          {ing.name}
                        </Text>
                        <View style={styles.macroGrid}>
                          <Text style={styles.macroMini}>PROT: {ing.protein}g</Text>
                          <Text style={styles.macroMini}>CARB: {ing.carbs}g</Text>
                          <Text style={styles.macroMini}>FAT: {ing.fat}g</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Ionicons name="stats-chart" size={18} color={colors.primary.amber} />
                    <Text style={styles.summaryTitle}>VALOR NUTRICIONAL TOTAL</Text>
                  </View>
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
            <Ionicons name="cloud-upload" size={20} color={colors.background.primary} />
          )}
          <Text style={styles.confirmButtonText}>
            {saving ? 'Guardando en la nube...' : 'Confirmar Registro'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, gap: SPACING.sm, zIndex: 10 },
  backLabel: { color: colors.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.base, fontWeight: '700' },
  content: { paddingBottom: 120 },
  photoContainer: { width: '100%', aspectRatio: 1.1, marginBottom: SPACING.xl, position: 'relative' },
  mainImageWrapper: { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#000' },
  mainImage: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { width: '100%', height: '100%', backgroundColor: colors.background.card, justifyContent: 'center', alignItems: 'center' },
  aiChipFloating: { position: 'absolute', top: SPACING.md, right: SPACING.md, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: 6, borderWidth: 1, borderColor: 'rgba(255,252,211,0.2)', zIndex: 10 },
  aiChipText: { color: colors.primary.amber, fontFamily: FONTS.primary, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  spatialBadge: { position: 'absolute', zIndex: 20, alignItems: 'center' },
  badgeLine: { width: 2, height: 15, backgroundColor: '#fff', opacity: 0.8 },
  badgeContent: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  badgeKcal: { color: '#000', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  badgeMacros: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  badgeMacroText: { color: '#666', fontSize: 9, fontWeight: '700' },
  badgeDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#ddd' },
  scanningOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,185,129,0.05)', justifyContent: 'center' },
  scanningLine: { width: '100%', height: 2, backgroundColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 15 },
  resultHeader: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg },
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
  summaryCard: { backgroundColor: '#111', borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: 'rgba(252,211,77,0.15)', marginHorizontal: SPACING.xl },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  summaryTitle: { color: colors.text.secondary, fontFamily: FONTS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryBlock: { alignItems: 'center', flex: 1 },
  summaryNumber: { color: colors.primary.amber, fontFamily: FONTS.primary, fontWeight: '800', fontSize: FONTS.sizes['2xl'] },
  summaryLabel: { color: colors.text.secondary, fontFamily: FONTS.primary, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: SPACING.xl * 2,
    gap: SPACING.md,
    marginTop: SPACING.xl * 2
  },
  errorTitle: { color: colors.text.primary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.lg, fontWeight: '700', textAlign: 'center' },
  errorText: { color: colors.text.secondary, fontFamily: FONTS.primary, fontSize: FONTS.sizes.base, textAlign: 'center', lineHeight: 22 },
  retryButton: { backgroundColor: colors.background.card, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: colors.status.error, marginTop: SPACING.lg },
  retryButtonText: { color: colors.status.error, fontFamily: FONTS.primary, fontWeight: '700' },
  ctaContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.xl, paddingBottom: SPACING['3xl'], backgroundColor: colors.background.primary, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' },
  confirmButton: { backgroundColor: colors.primary.amber, borderRadius: BORDER_RADIUS.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  confirmButtonText: { color: colors.background.primary, fontFamily: FONTS.primary, fontWeight: '700', fontSize: FONTS.sizes.base },
});
