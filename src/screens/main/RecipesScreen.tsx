import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useRecipes, useCreateRecipe, useRecommendationSession } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

const RecipesScreen = () => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { profile } = useProfile();
  const { data: recipes, isLoading } = useRecipes(profile?.id || '');
  const { mutate: createRecipe, isPending: creating } = useCreateRecipe();
  const { mutate: createRecommendation } = useRecommendationSession();
  
  const [showRecommendation, setShowRecommendation] = useState(false);

  const handleGetRecommendations = async () => {
    try {
      // Create recommendation session
      await createRecommendation({
        meal_type: 'lunch',
        remaining_calories: 600,
        remaining_protein: 25,
        remaining_carbs: 60,
        remaining_fat: 20,
      });
      
      Alert.alert('Éxito', 'Recomendaciones generadas');
      setShowRecommendation(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron generar recomendaciones');
    }
  };

  const renderRecipeCard = (recipe: any) => (
    <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
      {recipe.image_url && (
        <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} />
      )}
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle}>{recipe.name}</Text>
        <Text style={styles.recipeType}>{recipe.meal_type}</Text>
        <View style={styles.recipeMeta}>
          <Text style={styles.recipeTime}>{recipe.estimated_time}</Text>
          <Text style={styles.recipeDifficulty}>{recipe.difficulty}</Text>
        </View>
        {recipe.recipe_items && (
          <View style={styles.ingredientsPreview}>
            <Text style={styles.ingredientsTitle}>
              {recipe.recipe_items.length} ingredientes
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.favoriteButton}>
        <Ionicons 
          name={recipe.is_favorite ? 'heart' : 'heart-outline'} 
          size={20} 
          color={recipe.is_favorite ? colors.primary.amber : colors.text.secondary} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.primary.amber} />
        </TouchableOpacity>
        <Text style={styles.title}>Recetas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowRecommendation(true)}>
          <Ionicons name="add-circle" size={24} color={colors.primary.amber} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Recommendations Section */}
        <View style={styles.recommendationSection}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="sparkles" size={24} color={colors.primary.amber} />
            <Text style={styles.recommendationTitle}>Recomendaciones IA</Text>
          </View>
          <Text style={styles.recommendationSub}>
            Obtén recetas personalizadas basadas en tus ingredientes y metas
          </Text>
          <TouchableOpacity 
            style={styles.recommendationButton}
            onPress={handleGetRecommendations}
          >
            <Ionicons name="sparkles" size={20} color={colors.background.primary} />
            <Text style={styles.recommendationButtonText}>Generar Recomendaciones</Text>
          </TouchableOpacity>
        </View>

        {/* Recipes List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Recetas</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.amber} />
            </View>
          ) : recipes && recipes.length > 0 ? (
            recipes.map(renderRecipeCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant" size={48} color={colors.text.muted} />
              <Text style={styles.emptyText}>No tienes recetas guardadas</Text>
              <Text style={styles.emptySub}>Usa el generador de IA para crear recetas</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  addButton: {
    padding: SPACING.sm,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  recommendationSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.2)',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  recommendationTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
  },
  recommendationSub: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  recommendationButton: {
    backgroundColor: colors.primary.amber,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  recommendationButtonText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: colors.background.primary,
    fontFamily: FONTS.primary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.lg,
  },
  recipeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  recipeImage: {
    width: '100%',
    height: 150,
    backgroundColor: colors.background.tertiary,
  },
  recipeContent: {
    padding: SPACING.lg,
  },
  recipeTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: colors.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.xs,
  },
  recipeType: {
    fontSize: FONTS.sizes.sm,
    color: colors.primary.amber,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.sm,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  recipeTime: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  recipeDifficulty: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  ingredientsPreview: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
  },
  ingredientsTitle: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
  },
  favoriteButton: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg * 2,
  },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    color: colors.text.secondary,
    fontFamily: FONTS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONTS.sizes.sm,
    color: colors.text.muted,
    fontFamily: FONTS.primary,
    textAlign: 'center',
  },
});

export default RecipesScreen;
