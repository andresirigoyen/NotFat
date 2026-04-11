import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ghost, Sparkles, Send, Utensils, Zap, ChefHat, Salad, Coffee, ChefHat as ChefIcon } from 'lucide-react-native';
import { useAIChat } from '@/hooks/useAIChat';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NoFatScreen = () => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const [chatInput, setChatInput] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [generatedRecipe, setGeneratedRecipe] = React.useState<any>(null);
  const { processPrompt, loading, error } = useAIChat();

  // Manejo de errores con Alert
  React.useEffect(() => {
    if (error) {
      Alert.alert("Error en la cocina 👨‍🍳", "No pudimos conectar con el chef IA. Intenta de nuevo.");
    }
  }, [error]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { label: 'Desayunos', icon: <Coffee size={20} color="#7c2d12" />, color: '#fef3c7', prompt: 'Recetas saludables para desayunos equilibrados y nutritivos' },
    { label: 'Almuerzos', icon: <ChefHat size={20} color="#7c2d12" />, color: '#dcfce7', prompt: 'Recetas saludables para almuerzos completos y satisfactorios' },
    { label: 'Cenas', icon: <Utensils size={20} color="#7c2d12" />, color: '#fee2e2', prompt: 'Recetas saludables para cenas ligeras y digestivas' },
    { label: 'Snacks', icon: <Salad size={20} color="#7c2d12" />, color: '#e0f2fe', prompt: 'Snacks saludables y nutritivos para romper el ayuno' },
  ];

  const RECIPE_POOL = [
    { name: 'Bowl de Avena y Chía', kcal: 320, time: '10 min', tag: 'Desayuno', prompt: 'Bowl de avena y chía saludable' },
    { name: 'Salmón con Espárragos', kcal: 450, time: '20 min', tag: 'Almuerzo', prompt: 'Salmón a la plancha con espárragos' },
    { name: 'Tacos de Lechuga con Pollo', kcal: 280, time: '15 min', tag: 'Cena', prompt: 'Tacos de lechuga con pollo y aguacate' },
    { name: 'Ensalada de Quinoa', kcal: 350, time: '12 min', tag: 'Almuerzo', prompt: 'Ensalada de quinoa con vegetales' },
    { name: 'Smoothie Verde Detox', kcal: 180, time: '5 min', tag: 'Desayuno', prompt: 'Smoothie verde con espinaca y piña' },
    { name: 'Pechuga Cítrica', kcal: 400, time: '25 min', tag: 'Cena', prompt: 'Pechuga de pollo al limón con brócoli' },
    { name: 'Aguacate Relleno', kcal: 310, time: '8 min', tag: 'Snack', prompt: 'Aguacate relleno de atún' },
    { name: 'Pasta de Calabacín', kcal: 220, time: '15 min', tag: 'Cena', prompt: 'Zoodles (pasta de calabacín) al pesto' },
  ];

  const [suggestedRecipes, setSuggestedRecipes] = useState<typeof RECIPE_POOL>([]);

  // Barajar y seleccionar sugerencias al montar la pantalla
  React.useEffect(() => {
    const shuffled = [...RECIPE_POOL].sort(() => 0.5 - Math.random());
    setSuggestedRecipes(shuffled.slice(0, 2));
  }, []);

  const handleCategoryPress = async (category: typeof categories[0]) => {
    setIsGenerating(true);
    setSelectedCategory(category.label);
    setChatHistory(prev => [...prev, { role: 'user', message: `Quiero recetas de ${category.label.toLowerCase()}` }]);
    
    try {
      console.log('📤 Sending category prompt:', category.prompt);
      const result = await processPrompt(category.prompt);
      console.log('📥 Category result:', result);
      
      if (result && result.recipeData) {
        setGeneratedRecipe(result.recipeData);
        const friendlyMessage = result.response || `¡Aquí tienes recetas de ${category.label}! 🍽️`;
        setChatHistory(prev => [...prev, { role: 'ai', message: friendlyMessage }]);
      } else {
        console.log('⚠️ No recipe data in result');
        setGeneratedRecipe(null);
      }
    } catch (err: any) {
      console.error("❌ Error fetching category recipes:", err);
      Alert.alert("Error", err?.message || "No pudimos obtener recetas. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
      setSelectedCategory(null);
    }
  };

  const handleRecipePress = async (recipe: typeof suggestedRecipes[0]) => {
    setIsGenerating(true);
    setChatHistory(prev => [...prev, { role: 'user', message: `Quiero la receta de ${recipe.name}` }]);
    
    try {
      const result = await processPrompt(recipe.prompt);
      if (result && result.recipeData) {
        setGeneratedRecipe(result.recipeData);
        const friendlyMessage = result.response || `¡Aquí está la receta de ${recipe.name}! 🍽️`;
        setChatHistory(prev => [...prev, { role: 'ai', message: friendlyMessage }]);
      } else {
        setGeneratedRecipe(null);
      }
    } catch (err) {
      console.error("Error fetching recipe:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const ACCENT_COLOR = '#FBBF24';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.chefIconContainer}>
              <ChefIcon size={22} color={ACCENT_COLOR} />
            </View>
            <Text style={styles.brandText}>NotFat Chef</Text>
          </View>
          <View style={styles.aiBadge}>
            <Sparkles color={ACCENT_COLOR} size={14} fill={ACCENT_COLOR} />
            <Text style={styles.aiBadgeText}>Powered by Gemini</Text>
          </View>
        </View>

        {/* AI Chat Intro Card */}
        <View style={styles.chatIntroCardContainer}>
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.15)', 'transparent']}
            style={styles.chatIntroCard}
          >
            <View style={styles.introTopRow}>
              <View style={styles.logoCircle}>
                 <Text style={{fontSize: 32}}>👨‍🍳</Text>
              </View>
              <View>
                <Text style={styles.chatTitle}>¿Qué cocinamos hoy?</Text>
                <Text style={styles.chatSubtitle}>Indica tus ingredientes para una receta saludable.</Text>
              </View>
            </View>
            
            <View style={styles.chatInputWrapper}>
              <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Tengo brócoli, pollo y arroz..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={chatInput}
                  onChangeText={setChatInput}
                />
                <TouchableOpacity 
                  style={styles.sendBtn} 
                  disabled={loading || isGenerating}
                  onPress={async () => {
                    if (!chatInput.trim()) return;
                    
                    const userMessage = chatInput.trim();
                    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }]);
                    setChatInput('');
                    setIsGenerating(true);
                    
                    try {
                      const result = await processPrompt(userMessage);
                      if (result) {
                        // Limpiar respuesta de restos de JSON o markdown si vienen en el campo response
                        const cleanMessage = (result.response || '')
                          .replace(/```json[\s\S]*?```/g, '')
                          .replace(/{[\s\S]*?}/g, '')
                          .trim();

                        if (result.type === 'recipe' && result.recipeData) {
                          setGeneratedRecipe(result.recipeData);
                          const friendlyMessage = cleanMessage || '¡He creado una receta deliciosa para ti! 🍽️';
                          setChatHistory(prev => [...prev, { role: 'ai', message: friendlyMessage }]);
                        } else {
                          setGeneratedRecipe(null);
                          setChatHistory(prev => [...prev, { role: 'ai', message: cleanMessage || 'No entendí bien.' }]);
                        }
                      }
                    } catch (err) {
                      console.error("error:", err);
                    } finally {
                      setIsGenerating(false);
                    }
                  }}
                >
                  {loading || isGenerating ? <ActivityIndicator color="#000" size="small" /> : <Send color="#000" size={20} />}
                </TouchableOpacity>
              </BlurView>
            </View>
          </LinearGradient>
        </View>

        {/* Chat History */}
        {chatHistory.length > 0 ? (
          <View style={styles.chatHistory}>
                {chatHistory.map((msg, idx) => (
                  <View key={idx} style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.aiBubble
                  ]}>
                    <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <Text style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userText : styles.aiText
                    ]}>
                      {msg.message}
                    </Text>
                  </View>
                ))}
          </View>
        ) : null}

        {/* Generated Recipe */}
        {generatedRecipe && (
          <View style={styles.recipeCard}>
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeName}>{generatedRecipe.name}</Text>
              <Text style={styles.recipeTime}>{generatedRecipe.time} min • {generatedRecipe.difficulty}</Text>
            </View>
            <Text style={styles.recipeDescription}>{generatedRecipe.description}</Text>
            
            <View style={styles.nutritionInfo}>
              <Text style={styles.nutritionTitle}>Información Nutricional</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{generatedRecipe.nutrition?.calories || 0}</Text>
                  <Text style={styles.nutritionLabel}>Calorías</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{generatedRecipe.nutrition?.protein || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Proteína</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{generatedRecipe.nutrition?.carbs || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Carbos</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{generatedRecipe.nutrition?.fat || 0}g</Text>
                  <Text style={styles.nutritionLabel}>Grasas</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.ingredientsSection}>
              <Text style={styles.sectionTitle}>Ingredientes ({generatedRecipe.servings || 1} porciones)</Text>
              {generatedRecipe.ingredients?.map((ingredient: string, idx: number) => (
                <Text key={idx} style={styles.ingredientItem}>• {ingredient}</Text>
              ))}
            </View>
            
            {/* Beneficios para la salud */}
            {generatedRecipe.healthBenefits && (
              <View style={styles.healthSection}>
                <Text style={styles.sectionTitle}>💚 Beneficios para tu salud</Text>
                {generatedRecipe.healthBenefits.map((benefit: string, idx: number) => (
                  <Text key={idx} style={styles.healthItem}>✓ {benefit}</Text>
                ))}
              </View>
            )}
            
            {/* Alérgenos y timing */}
            <View style={styles.metaSection}>
              {generatedRecipe.allergens && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>⚠️ Alérgenos:</Text>
                  <Text style={styles.metaValue}>{Array.isArray(generatedRecipe.allergens) ? generatedRecipe.allergens.join(', ') : generatedRecipe.allergens}</Text>
                </View>
              )}
              {generatedRecipe.mealTiming && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>⏰ Mejor momento:</Text>
                  <Text style={styles.metaValue}>{generatedRecipe.mealTiming}</Text>
                </View>
              )}
              {generatedRecipe.suggestedPairing && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>🥤 Sugerencia:</Text>
                  <Text style={styles.metaValue}>{generatedRecipe.suggestedPairing}</Text>
                </View>
              )}
            </View>
            
            {/* Tags dietéticas */}
            {generatedRecipe.dietaryTags && (
              <View style={styles.tagsSection}>
                {generatedRecipe.dietaryTags.map((tag: string, idx: number) => (
                  <View key={idx} style={styles.dietaryTag}>
                    <Text style={styles.dietaryTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            
            <View style={styles.instructionsSection}>
              <Text style={styles.sectionTitle}>Preparación</Text>
              {generatedRecipe.instructions?.map((instruction: string, idx: number) => (
                <Text key={idx} style={styles.instructionItem}>
                  {idx + 1}. {instruction}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Categories Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explorar categorías</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.catCard, { backgroundColor: cat.color }]}
              onPress={() => handleCategoryPress(cat)}
              disabled={isGenerating}
            >
              {cat.icon}
              <Text style={styles.catLabel}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Suggested Recipes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sugerencias para ti</Text>
          <TouchableOpacity><Text style={styles.seeAll}>Ver todas</Text></TouchableOpacity>
        </View>

        {suggestedRecipes.map((recipe, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.recipeCard}
            onPress={() => handleRecipePress(recipe)}
            disabled={isGenerating}
          >
            <View style={styles.recipeImagePlaceholder}>
              <ChefHat color="#cbd5e1" size={40} />
            </View>
            <View style={styles.recipeInfo}>
              <View style={styles.tagRow}>
                <View style={styles.tag}><Text style={styles.tagText}>{recipe.tag}</Text></View>
                <View style={styles.aiTag}><Zap color="#22c55e" size={10} fill="#22c55e" /><Text style={styles.aiTagText}>IA</Text></View>
              </View>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <Text style={styles.recipeStats}>{recipe.kcal} kcal • {recipe.time}</Text>
            </View>
            <TouchableOpacity style={styles.favBtn}>
              <Sparkles color="#94a3b8" size={20} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#FFF',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chefIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#000',
    letterSpacing: -0.5,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.2)',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
  },
  chatIntroCardContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)',
  },
  chatIntroCard: {
    padding: 24,
  },
  introTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#000',
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 13,
    color: isDark ? 'rgba(255,255,255,0.5)' : '#666',
    fontWeight: '600',
  },
  chatInputWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 6,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: 15,
    color: isDark ? '#FFF' : '#000',
    fontSize: 14,
    fontWeight: '600',
    height: 48,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#000',
    letterSpacing: -0.4,
  },
  catScroll: {
    marginBottom: 25,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  catCard: {
    width: '23%',
    aspectRatio: 1,
    maxWidth: 100,
    borderRadius: 24,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  seeAll: {
    color: '#FBBF24',
    fontWeight: '800',
    fontSize: 13,
  },
  recipeCard: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F8F8',
    borderRadius: 24,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  recipeImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
    textTransform: 'uppercase',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#22C55E',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#000',
    marginBottom: 2,
  },
  recipeStats: {
    fontSize: 13,
    color: isDark ? 'rgba(255,255,255,0.4)' : '#666',
    fontWeight: '600',
  },
  favBtn: {
    padding: 8,
  },
  chatHistory: {
    marginBottom: 20,
  },
  messageBubble: { 
    maxWidth: '85%', 
    padding: 14, 
    borderRadius: 18, 
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignSelf: 'flex-end',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
    fontWeight: '600',
  },
  aiText: {
    color: '#FFF',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recipeTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: 15,
    color: isDark ? '#CCC' : '#444',
    lineHeight: 22,
    marginBottom: 20,
  },
  nutritionInfo: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F8F8',
    padding: 18,
    borderRadius: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nutritionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#000',
    marginBottom: 15,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FBBF24',
  },
  nutritionLabel: {
    fontSize: 10,
    color: isDark ? 'rgba(255,255,255,0.4)' : '#666',
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  ingredientItem: {
    fontSize: 15,
    color: isDark ? '#CCC' : '#444',
    lineHeight: 24,
    marginBottom: 6,
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionItem: {
    fontSize: 15,
    color: isDark ? '#CCC' : '#444',
    lineHeight: 24,
    marginBottom: 10,
  },
  healthSection: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 18,
    borderRadius: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  healthItem: {
    fontSize: 14,
    color: '#22C55E',
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '600',
  },
  metaSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 18,
    borderRadius: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  metaItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FBBF24',
    marginRight: 8,
  },
  metaValue: {
    fontSize: 13,
    color: isDark ? '#FFF' : '#000',
    flex: 1,
    fontWeight: '600',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  dietaryTag: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  dietaryTagText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
  },
});

export default NoFatScreen;
