import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Animated, { FadeInUp, FadeIn, SlideInRight } from 'react-native-reanimated';
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const RecipeDetailScreen = () => {
  const { colors, isDark } = useThemeColors();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { isPro } = useTierPermissions();
  const { recipe } = route.params as { recipe: any };

  const [portions, setPortions] = useState(1);
  const [activeTab, setActiveTab] = useState<'Receta' | 'Impacto'>('Receta');

  const ACCENT_COLOR = colors.primary.amber || '#FBBF24';
  const BG_COLOR = '#000000';
  const CARD_BG = 'rgba(255, 255, 255, 0.05)';

  // Data processing from dynamic recipeData
  const details = {
    time: recipe.time || '15 min',
    difficulty: recipe.difficulty || 'Fácil',
    tags: recipe.tags || ['Nutritivo', 'Rápido'],
    nutrition: recipe.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    description: recipe.description || recipe.desc || 'Una deliciosa opción preparada con ingredientes frescos y balanceados para tu meta nutricional.',
    mealType: recipe.mealType || 'Almuerzo'
  };

  const renderMacro = (label: string, value: number, unit: string, icon: string, color: string) => (
    <View style={styles.macroBadge}>
      <View style={[styles.macroIconBg, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <View>
        <Text style={styles.macroValue}>{value * portions}{unit}</Text>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: BG_COLOR }]}>
      <StatusBar barStyle="light-content" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>

        {/* Header Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{
              uri: recipe.imageURL ||
                `https://loremflickr.com/800/600/${(recipe.name || 'food').replace(/ /g, ',')},recipe`
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.9)']}
            style={StyleSheet.absoluteFillObject}
          />

          <SafeAreaView style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn}>
              <Ionicons name="heart-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.heroBottomInfo}>
            <View style={styles.mealTypeBadge}>
              <Text style={styles.mealTypeText}>{details.mealType.toUpperCase()}</Text>
            </View>
            <Text style={styles.mainTitle}>{recipe.name || recipe.title}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons name="time-outline" size={14} color={ACCENT_COLOR} />
                <Text style={styles.metaBadgeText}>{details.time}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Ionicons name="flash-outline" size={14} color={ACCENT_COLOR} />
                <Text style={styles.metaBadgeText}>{details.difficulty}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Ionicons name="star" size={14} color={ACCENT_COLOR} />
                <Text style={styles.metaBadgeText}>8.5 Nutri-Score</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          {/* Quick Nutrition Overview */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.macrosRow}>
            {renderMacro('Calorías', details.nutrition.calories, 'kcal', 'flame', '#FF6B6B')}
            {renderMacro('Proteína', details.nutrition.protein, 'g', 'fitness', '#4DABF7')}
            {renderMacro('Carbos', details.nutrition.carbs, 'g', 'leaf', '#FFD43B')}
            {renderMacro('Grasas', details.nutrition.fat, 'g', 'water', '#63E6BE')}
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.descCard}>
            <Text style={styles.descTitle}>Sobre esta receta</Text>
            <Text style={styles.descText}>{details.description}</Text>
          </Animated.View>

          {/* Portions & Interaction */}
          <View style={styles.interactiveRow}>
            <View style={styles.portionsCard}>
              <Text style={styles.portionsTitle}>Porciones</Text>
              <View style={styles.portionsActions}>
                <TouchableOpacity style={styles.portionActionBtn} onPress={() => setPortions(Math.max(1, portions - 1))}>
                  <Ionicons name="remove" size={18} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.portionValue}>{portions}</Text>
                <TouchableOpacity style={styles.portionActionBtn} onPress={() => setPortions(portions + 1)}>
                  <Ionicons name="add" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn}>
              <Ionicons name="bookmark-outline" size={20} color={ACCENT_COLOR} />
              <Text style={[styles.saveBtnText, { color: ACCENT_COLOR }]}>Guardar</Text>
            </TouchableOpacity>
          </View>

          {/* Content Tabs */}
          <View style={styles.tabsWrapper}>
            <View style={styles.tabHeader}>
              <TouchableOpacity
                onPress={() => setActiveTab('Receta')}
                style={[styles.tabBtn, activeTab === 'Receta' && styles.tabBtnActive]}
              >
                <Text style={[styles.tabBtnText, activeTab === 'Receta' && styles.tabBtnTextActive]}>Instrucciones</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('Impacto')}
                style={[styles.tabBtn, activeTab === 'Impacto' && styles.tabBtnActive]}
              >
                <Ionicons name="analytics" size={16} color={activeTab === 'Impacto' ? ACCENT_COLOR : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.tabBtnText, activeTab === 'Impacto' && styles.tabBtnTextActive]}>Impacto Metabólico</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContent}>
              {activeTab === 'Receta' ? (
                <Animated.View entering={FadeIn}>
                  <Text style={styles.sectionHeading}>Ingredientes Necesarios</Text>
                  {details.ingredients.length > 0 ? (
                    details.ingredients.map((ing: any, i: number) => (
                      <View key={i} style={styles.ingredientRow}>
                        <View style={styles.ingDot} />
                        <Text style={styles.ingText}>
                          <Text style={styles.ingAmount}>{ing.amount * portions} {ing.unit}</Text> de {ing.name}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>La IA no especificó ingredientes detallados para esta sugerencia.</Text>
                  )}

                  <Text style={[styles.sectionHeading, { marginTop: 30 }]}>Preparación paso a paso</Text>
                  {details.instructions.length > 0 ? (
                    details.instructions.map((step: string, i: number) => (
                      <View key={i} style={styles.prepStep}>
                        <View style={styles.stepNumContainer}>
                          <Text style={styles.stepNum}>{i + 1}</Text>
                        </View>
                        <Text style={styles.stepContent}>{step}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Consulta al Coach para obtener los pasos específicos de preparación.</Text>
                  )}
                </Animated.View>
              ) : (
                <Animated.View entering={FadeIn} style={styles.impactTab}>
                  {!isPro ? (
                    <View style={styles.proLocked}>
                      <Ionicons name="lock-closed" size={40} color={ACCENT_COLOR} />
                      <Text style={styles.proLockedTitle}>Análisis de Impacto Glucémico</Text>
                      <Text style={styles.proLockedDesc}>
                        Como usuario Elite, podrías ver cómo esta receta afecta tus niveles de glucosa y energía según tu perfil metabólico.
                      </Text>
                      <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={() => navigation.navigate('SubscriptionCenter' as never)}
                      >
                        <Text style={styles.upgradeBtnText}>Pásate a PRO</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.impactData}>
                      <View style={styles.impactCircle}>
                        <Text style={styles.impactScore}>94</Text>
                        <Text style={styles.impactScoreLabel}>Score Salud</Text>
                      </View>
                      <Text style={styles.impactSummary}>
                        Esta receta tiene una carga glucémica baja. Es ideal para mantener la estabilidad de insulina y evitar picos de fatiga por la tarde.
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Floating Call to Action */}
      <BlurView intensity={80} tint="dark" style={styles.footerAction}>
        <TouchableOpacity style={styles.addLogBtn}>
          <LinearGradient
            colors={[ACCENT_COLOR, '#DE9E1F']}
            style={styles.gradBtn}
          >
            <Ionicons name="add-circle" size={24} color="#000" />
            <Text style={styles.addLogBtnText}>Registrar en mi día</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.coachChatBtn}>
          <Ionicons name="chatbubble-ellipses" size={24} color={ACCENT_COLOR} />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 420,
    backgroundColor: '#111',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBottomInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  mealTypeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  mealTypeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONTS.primary,
    marginBottom: 12,
    letterSpacing: -1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 15,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  contentSection: {
    paddingHorizontal: 20,
    marginTop: -20,
    backgroundColor: '#000',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  macroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  macroLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  descCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
  },
  interactiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  portionsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 18,
  },
  portionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  portionsActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portionActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tabsWrapper: {
    marginBottom: 20,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  tabBtnTextActive: {
    color: '#FFF',
  },
  tabContent: {
    paddingBottom: 20,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 15,
    letterSpacing: -0.5,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 15,
  },
  ingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.4)',
    marginRight: 12,
  },
  ingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  ingAmount: {
    color: '#FFF',
    fontWeight: '800',
  },
  prepStep: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  stepNumContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  stepNum: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 24,
  },
  footerAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  addLogBtn: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addLogBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  coachChatBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  proLocked: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(251, 191, 36, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.1)',
  },
  proLockedTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 8,
  },
  proLockedDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  upgradeBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  impactTab: {
    paddingBottom: 10,
  },
  impactData: {
    alignItems: 'center',
    padding: 20,
  },
  impactCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 5,
    borderColor: '#4DABF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  impactScore: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
  },
  impactScoreLabel: {
    fontSize: 10,
    color: '#4DABF7',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  impactSummary: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  }
});

export default RecipeDetailScreen;
