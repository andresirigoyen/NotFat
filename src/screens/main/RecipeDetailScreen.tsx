import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FONTS, SPACING } from '@/constants/theme';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useTierPermissions } from '@/hooks/useTierPermissions';

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

  const ACCENT_COLOR = '#FBBF24';
  const BG_COLOR = '#0A0A0B';
  const CARD_BG = '#151517';

  // Mocked details matching the screenshot if not available in `recipe` object
  const details = {
    time: recipe.time || '10 min',
    difficulty: recipe.difficulty || 'Fácil',
    tags: recipe.tags || ['Rápida'],
    ingredients: recipe.ingredients || [
      { name: 'Pulpa de açaí', amount: 100, unit: 'g', cal: 70, p: 1, c: 6, f: 5 },
      { name: 'Plátano congelado', amount: 100, unit: 'g', cal: 90, p: 1, c: 23, f: 0 },
      { name: 'Leche de almendras', amount: 80, unit: 'ml', cal: 10, p: 0, c: 1, f: 1 },
      { name: 'Granola', amount: 30, unit: 'g', cal: 130, p: 3, c: 20, f: 5 },
      { name: 'Arándanos', amount: 40, unit: 'g', cal: 23, p: 0, c: 6, f: 0 },
      { name: 'Coco rallado', amount: 10, unit: 'g', cal: 35, p: 0, c: 2, f: 3 },
      { name: 'Semillas de chía', amount: 8, unit: 'g', cal: 39, p: 1, c: 3, f: 3 },
      { name: 'Miel', amount: 5, unit: 'g', cal: 15, p: 0, c: 4, f: 0 },
    ],
    instructions: recipe.instructions || [
      'Licuar la pulpa de açaí con el plátano congelado y un chorrito de leche de almendras hasta obtener una textura cremosa y espesa.',
      'Servir la mezcla en un bowl.',
      'Agregar la granola, rodajas de plátano, arándanos y coco rallado por encima.',
      'Decorar con semillas de chía y un toque de miel.',
    ]
  };

  return (
    <View style={[styles.container, { backgroundColor: BG_COLOR }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Header Image */}
        <View style={styles.headerImageContainer}>
          <Image 
            source={{ uri: recipe.imageURL || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80' }} 
            style={StyleSheet.absoluteFillObject} 
          />
          <View style={styles.imageOverlay} />
          
          <TouchableOpacity 
            style={[styles.topButton, { top: insets.top + 10, left: 20 }]} 
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={30} tint="dark" style={styles.blurIcon}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.topButton, { top: insets.top + 10, right: 20 }]} 
          >
            <BlurView intensity={30} tint="dark" style={styles.blurIcon}>
              <Ionicons name="heart-outline" size={24} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Content Wrapper overlapping the image slightly */}
        <View style={styles.contentWrapper}>
          
          {/* Title & Description Card */}
          <View style={[styles.card, { backgroundColor: CARD_BG, marginTop: -40 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={[styles.title, { flex: 1 }]}>{recipe.title || recipe.name}</Text>
              {!isPro && (
                <View style={[styles.proBadge, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                  <Ionicons name="star" size={12} color={ACCENT_COLOR} />
                  <Text style={[styles.proBadgeText, { color: ACCENT_COLOR }]}>PRO</Text>
                </View>
              )}
            </View>
            
            <View style={styles.tagsRow}>
              {details.tags.map((tag: string, i: number) => (
                <View key={i} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.metaText}>{details.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="stats-chart" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.metaText}>{details.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.description}>{recipe.desc || recipe.description}</Text>
          </View>

          {/* Portions Selector */}
          <View style={[styles.card, styles.portionsCard, { backgroundColor: CARD_BG }]}>
            <Text style={styles.sectionTitle}>Porciones</Text>
            <View style={styles.portionsControls}>
              <TouchableOpacity style={styles.portionButton} onPress={() => setPortions(Math.max(1, portions - 1))}>
                <Ionicons name="remove" size={20} color={ACCENT_COLOR} />
              </TouchableOpacity>
              <Text style={styles.portionNumber}>{portions}</Text>
              <TouchableOpacity style={styles.portionButton} onPress={() => setPortions(portions + 1)}>
                <Ionicons name="add" size={20} color={ACCENT_COLOR} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.card, { backgroundColor: CARD_BG, padding: 0, overflow: 'hidden' }]}>
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Receta' && { borderBottomColor: ACCENT_COLOR }]}
                onPress={() => setActiveTab('Receta')}
              >
                <Text style={[styles.tabText, activeTab === 'Receta' && { color: ACCENT_COLOR }]}>Receta</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Impacto' && { borderBottomColor: ACCENT_COLOR }]}
                onPress={() => setActiveTab('Impacto')}
              >
                <Text style={[styles.tabText, activeTab === 'Impacto' && { color: ACCENT_COLOR }]}>Impacto</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'Receta' ? (
              <Animated.View entering={FadeInUp} style={styles.tabContent}>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Ingredientes</Text>
                
                {details.ingredients.map((ing: any, i: number) => (
                  <View key={i} style={styles.ingredientCard}>
                    <TouchableOpacity style={styles.radioCircle} />
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>
                        <Text style={{color: ACCENT_COLOR, fontWeight: '800'}}>{ing.amount * portions} {ing.unit} </Text>
                        de {ing.name}
                      </Text>
                      <View style={styles.ingredientMacros}>
                        <Ionicons name="flame" size={10} color="#F87171" />
                        <Text style={styles.macroText}>{ing.cal * portions}</Text>
                        <Ionicons name="fitness" size={10} color="#34D399" style={{marginLeft: 8}} />
                        <Text style={styles.macroText}>{ing.p * portions}g</Text>
                        <Ionicons name="nutrition" size={10} color="#60A5FA" style={{marginLeft: 8}} />
                        <Text style={styles.macroText}>{ing.c * portions}g</Text>
                        <Ionicons name="water" size={10} color="#FCD34D" style={{marginLeft: 8}} />
                        <Text style={styles.macroText}>{ing.f * portions}g</Text>
                      </View>
                    </View>
                  </View>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 16 }]}>Preparación</Text>
                
                {details.instructions.map((step: string, i: number) => (
                  <View key={i} style={styles.stepCard}>
                    <View style={[styles.stepNumberBadge, { backgroundColor: ACCENT_COLOR }]}>
                      <Text style={styles.stepNumberBadgeText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}

              </Animated.View>
            ) : (
              <Animated.View entering={FadeInUp} style={[styles.tabContent, { minHeight: 280, justifyContent: 'center', alignItems: 'center' }]}>
                {!isPro ? (
                  <View style={styles.lockedContainer}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.lockContent}>
                      <View style={styles.lockIconCircle}>
                        <Ionicons name="lock-closed" size={32} color={ACCENT_COLOR} />
                      </View>
                      <Text style={styles.lockedTitle}>Análisis Metabólico Pro</Text>
                      <Text style={styles.lockedDesc}>
                        Descubre cómo esta receta impacta tus niveles de glucosa y energía. Exclusivo para miembros Elite.
                      </Text>
                      <TouchableOpacity 
                        style={styles.unlockButton}
                        onPress={() => navigation.navigate('SubscriptionCenter' as never)}
                      >
                        <Text style={styles.unlockButtonText}>Desbloquear ahora</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Ionicons name="bar-chart-outline" size={48} color={ACCENT_COLOR} />
                    <Text style={[styles.description, { textAlign: 'center', marginTop: 16 }]}>
                      Análisis de impacto glucémico: Bajo {'\n'}
                      Estabilidad energética: 98% {'\n'}
                      Ideal para tu ventana metabólica de hoy.
                    </Text>
                  </>
                )}
              </Animated.View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={[styles.floatingActionContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.primaryButton}>
          <Ionicons name="add-circle-outline" size={24} color="#000" />
          <Text style={styles.primaryButtonText}>Agregar comida</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.chatButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={ACCENT_COLOR} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: '#111',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topButton: {
    position: 'absolute',
    zIndex: 10,
  },
  blurIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentWrapper: {
    paddingHorizontal: SPACING.md,
  },
  card: {
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONTS.primary,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tagBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    color: '#2ECC71',
    fontWeight: '800',
    fontSize: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 13,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    fontFamily: FONTS.primary,
  },
  portionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: FONTS.primary,
  },
  portionsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  portionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    fontFamily: FONTS.primary,
  },
  tabContent: {
    padding: SPACING.lg,
  },
  ingredientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    marginRight: 16,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  ingredientMacros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberBadgeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: FONTS.primary,
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
    backgroundColor: 'rgba(10, 10, 11, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    height: 64,
    backgroundColor: '#FBBF24',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    fontFamily: FONTS.primary,
  },
  chatButton: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lockedContainer: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  lockIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 16,
  },
  lockedTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  unlockButton: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  unlockButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default RecipeDetailScreen;
