import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const RecipeDetailScreen = () => {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const route = useRoute();
  const { recipe } = route.params as { recipe: any };

  const ACCENT_COLOR = '#FBBF24';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image / Placeholder */}
        <View style={styles.headerImageContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent']}
            style={styles.imageOverlay}
          />
          <View style={styles.placeholderContainer}>
            <Text style={{fontSize: 80}}>🥘</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={30} tint="dark" style={styles.backBlur}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.name}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color={ACCENT_COLOR} />
              <Text style={styles.metaText}>{recipe.time} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flash-outline" size={18} color={ACCENT_COLOR} />
              <Text style={styles.metaText}>{recipe.difficulty || 'Fácil'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="nutrition-outline" size={18} color={ACCENT_COLOR} />
              <Text style={styles.metaText}>{recipe.nutrition?.calories || 0} kcal</Text>
            </View>
          </View>

          <Text style={styles.description}>{recipe.description}</Text>

          {/* Nutrition Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Macros</Text>
            <View style={styles.nutritionGrid}>
              {[
                { label: 'CALORÍAS', value: recipe.nutrition?.calories, color: ACCENT_COLOR },
                { label: 'PROTEÍNA', value: `${recipe.nutrition?.protein}g`, color: '#22C55E' },
                { label: 'CARBOS', value: `${recipe.nutrition?.carbs}g`, color: '#3B82F6' },
                { label: 'GRASAS', value: `${recipe.nutrition?.fat}g`, color: '#EF4444' },
              ].map((item, idx) => (
                <View key={idx} style={styles.nutritionItem}>
                  <Text style={[styles.nutritionValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.nutritionLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            {recipe.ingredients?.map((item: string, idx: number) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instrucciones</Text>
            {recipe.instructions?.map((item: string, idx: number) => (
              <View key={idx} style={styles.instructionItem}>
                <View style={[styles.stepNumber, { borderColor: ACCENT_COLOR }]}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Tips / Health Benefits */}
          {recipe.healthBenefits && (
            <BlurView intensity={10} tint={isDark ? "dark" : "light"} style={styles.healthCard}>
              <Text style={styles.healthTitle}>💚 Beneficios Saludables</Text>
              {recipe.healthBenefits.map((benefit: string, idx: number) => (
                <Text key={idx} style={styles.healthText}>• {benefit}</Text>
              ))}
            </BlurView>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#111',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    padding: 24,
    marginTop: -30,
    backgroundColor: '#000',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    minHeight: 500,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FBBF24',
  },
  listText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
    flex: 1,
  },
  healthCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    overflow: 'hidden',
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#22C55E',
    marginBottom: 10,
  },
  healthText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    marginBottom: 4,
  },
});

export default RecipeDetailScreen;
