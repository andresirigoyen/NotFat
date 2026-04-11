import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FONTS, SPACING, BORDER_RADIUS, COLORS } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '@/hooks/useProfile';
import { useDailyTotals } from '@/hooks/useDailyTotals';

const { width } = Dimensions.get('window');

// Simulate API call
const fetchRecipes = async () => {
  return [
    { 
      id: '1', 
      title: 'Mexican Bowl Elite', 
      calories: 450, 
      protein: 30, 
      carbs: 45, 
      fats: 15, 
      imageURL: 'file:///Users/andresirigoyen/.gemini/antigravity/brain/08d09c4b-0330-47c9-b881-ce1f1c2a8fa5/mexican_bowl_premium_1775943324584.png',
      desc: 'Packed with flavor, Mexican food is a favorite for many.'
    },
    { 
      id: '2', 
      title: 'Grilled Salmon Quinoa', 
      calories: 650, 
      protein: 45, 
      carbs: 30, 
      fats: 25, 
      imageURL: 'file:///Users/andresirigoyen/.gemini/antigravity/brain/08d09c4b-0330-47c9-b881-ce1f1c2a8fa5/salmon_quinoa_elite_1775943337546.png',
      desc: 'High protein meal for muscle recovery.'
    },
    { 
      id: '3', 
      title: 'Creamy Asparagus Soup', 
      calories: 200, 
      protein: 5, 
      carbs: 20, 
      fats: 8, 
      imageURL: 'file:///Users/andresirigoyen/.gemini/antigravity/brain/08d09c4b-0330-47c9-b881-ce1f1c2a8fa5/asparagus_soup_minimalist_1775943352603.png',
      desc: 'Light and nutritious seasonal soup.'
    },
    { 
      id: '4', 
      title: 'Asian Fusion Tofu Bowl', 
      calories: 550, 
      protein: 35, 
      carbs: 50, 
      fats: 18, 
      imageURL: 'file:///Users/andresirigoyen/.gemini/antigravity/brain/08d09c4b-0330-47c9-b881-ce1f1c2a8fa5/asian_fusion_bowl_vibrant_1775943365926.png',
      desc: 'Umami flavors with high nutritional value.'
    },
  ];
};

const CATEGORIES = [
  { id: '1', name: 'Breakfast', icon: '☕' },
  { id: '2', name: 'Lunch', icon: '🍱' },
  { id: '3', name: 'Dinner', icon: '🍽️' },
  { id: '4', name: 'High Protein', icon: '🍳' },
  { id: '5', name: 'Low Carb', icon: '🥜' },
];

import { PremiumGuard } from '@/components/ui/PremiumGuard';

const RecipesScreen = () => {
  const { colors, isDark } = useThemeColors();
  const styles = getStyles(colors, isDark);
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Discover');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { profile } = useProfile();
  const { data: totals } = useDailyTotals();

  const coachMode = profile?.coach_mode || 'soft';
  const calorieTarget = profile?.daily_calorie_target || 2000;
  const remainingCalories = calorieTarget - (totals?.calories || 0);

  useEffect(() => {
    fetchRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  const renderRecipeCard = (item: any, isWide = false) => {
    const isHighCalorie = item.calories > 600;
    const fitsMacros = item.calories <= remainingCalories;

    return (
      <TouchableOpacity 
        key={item.id} 
        style={[styles.recipeCard, isWide && styles.wideCard]}
        onPress={() => navigation.navigate('RecipeDetail', { recipe: item })}
      >
        <Image source={{ uri: item.imageURL }} style={styles.recipeImage} />
        
        {/* Coach Mode Interventions */}
        {coachMode === 'hard' && isHighCalorie && (
          <View style={styles.hardWarning}>
            <Ionicons name="warning" size={14} color="#FFF" />
            <Text style={styles.hardWarningText}>Nivel de Peligro: Alto. Solo si has entrenado hoy.</Text>
          </View>
        )}

        {coachMode === 'soft' && fitsMacros && (
          <View style={styles.softRecommendation}>
            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
            <Text style={styles.softRecommendationText}>Recomendado para ti</Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.recipeOverlay}
        >
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeTitle}>{item.title}</Text>
            <View style={styles.recipeMeta}>
              <Text style={styles.recipeDetailText}>{item.calories} kcal</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.recipeDetailText}>{item.protein}g P</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary.amber} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="basket-outline" size={24} color={colors.primary.sky} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipes</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="search-outline" size={24} color={colors.primary.sky} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="options-outline" size={24} color={colors.primary.sky} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['Discover', 'My Favorites'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.categoryCard}>
                <View style={styles.categoryIconBg}>
                  <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Recipes Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>For You ({coachMode} mode)</Text>
          <View style={styles.recipeGrid}>
            {recipes.map((recipe, index) => (
               index < 2 ? renderRecipeCard(recipe) : (
                 <PremiumGuard key={recipe.id} style={{ marginHorizontal: 4, marginBottom: 12 }}>
                    {renderRecipeCard(recipe)}
                 </PremiumGuard>
               )
            ))}
          </View>
        </View>

        {/* Special Occasions - Wide Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Collections (Pro)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {recipes.slice(0, 2).map(recipe => (
              <PremiumGuard key={recipe.id + '_featured'} style={{ marginRight: 12 }}>
                {renderRecipeCard(recipe, true)}
              </PremiumGuard>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FONTS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  headerIcon: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    paddingVertical: SPACING.md,
    marginRight: SPACING.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary.sky,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.muted,
  },
  activeTabText: {
    color: colors.primary.sky,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    fontFamily: FONTS.primary,
  },
  horizontalScroll: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 80,
  },
  categoryIconBg: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg / 2,
  },
  recipeCard: {
    width: (width - SPACING.lg * 2) / 2 - 8,
    height: 220,
    marginHorizontal: 4,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#151517',
  },
  wideCard: {
    width: 280,
    height: 180,
    marginRight: 12,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    height: '60%',
    justifyContent: 'flex-end',
  },
  recipeInfo: {
    gap: 4,
  },
  recipeTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONTS.primary,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recipeDetailText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    color: 'rgba(255,255,255,0.3)',
  },
  hardWarning: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.85)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  hardWarningText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    flex: 1,
  },
  softRecommendation: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  softRecommendationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default RecipesScreen;
