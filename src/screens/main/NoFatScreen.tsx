import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ghost, Sparkles, Send, Utensils, Zap, ChefHat, Salad, Coffee, ChefHat as ChefIcon } from 'lucide-react-native';
import { useAIChat } from '@/hooks/useAIChat';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store';
import { useScanStore } from '@/store/scans';
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { useProfile } from '@/hooks/useProfile';
import { PremiumGuard } from '@/components/ui/PremiumGuard';
import { Target, TrendingUp, BrainCircuit } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const NoFatScreen = () => {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation<any>();
  const { profile } = useProfile();

  const isWeekend = React.useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    // Viernes después de las 4 PM (5) hasta Domingo (0)
    if (day === 5 && hour >= 16) return true;
    if (day === 6 || day === 0) return true;
    return false;
  }, []);

  const [chatInput, setChatInput] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<Array<{role: 'user' | 'ai', message: string}>>([]);
  const [generatedRecipe, setGeneratedRecipe] = React.useState<any>(null);
  const { processPrompt, loading, error } = useAIChat();
  const { isPro, maxDailyMessages, maxAiSuggestionsOnLoad, canRefreshAiSuggestions } = useTierPermissions();
  const { getTodayMessages, incrementMessage } = useScanStore();

  const todayMessages = getTodayMessages();
  const isMessageLimitReached = todayMessages >= maxDailyMessages;

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

  // --- DYNAMIC AI SUGGESTIONS ---
  interface AISuggestedRecipe {
    name: string;
    kcal: number;
    time: string;
    tag: string;
    prompt: string;
    emoji: string;
  }

  // Pool of random ingredient combos to ensure variety
  const PROMPT_SEEDS = [
    'pollo y verduras de temporada', 'salmón y espárragos', 'lentejas y espinacas',
    'atún y aguacate', 'tofu y brócoli', 'huevo y champiñones', 'garbanzos y pimiento',
    'pavo y batata', 'quinoa y pepino', 'camarones y limón', 'berenjenas y tomate',
    'avena y frutas rojas', 'requesón y nueces', 'sardinas y alcaparras',
    'carne magra y zanahorias', 'res magra y arroz integral',
  ];

  const MEAL_EMOJIS: Record<string, string> = {
    Desayuno: '🌅', Almuerzo: '🍽️', Cena: '🌙', Snack: '🥗',
  };

  const [aiSuggestions, setAiSuggestions] = useState<AISuggestedRecipe[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const generateAISuggestions = async (isRefresh = false) => {
    // Check tier capabilities for refresh
    if (isRefresh && !canRefreshAiSuggestions) {
      Alert.alert(
        '🔒 Función Pro',
        'Regenerar sugerencias ilimitadas con el plan Pro. Las sugerencias frescas de IA son exclusivas de Pro.',
        [
          { text: 'Ver planes', onPress: () => navigation.navigate('SubscriptionCenter') },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    // Check daily limit before calling AI
    const currentMessages = getTodayMessages();
    const remaining = isPro ? Infinity : Math.max(0, maxDailyMessages - currentMessages);

    if (remaining === 0) {
      Alert.alert(
        'Límite diario alcanzado',
        `Has agotado tus ${maxDailyMessages} mensajes de IA por hoy. Vuelve mañana o pásate a Pro.`,
      );
      return;
    }

    // Cap calls at what the user has remaining or what the tier allows per load
    const seedCount = isPro ? maxAiSuggestionsOnLoad : Math.min(maxAiSuggestionsOnLoad, remaining);

    setLoadingAI(true);
    setAiSuggestions([]);
    try {
      const shuffledSeeds = [...PROMPT_SEEDS].sort(() => Math.random() - 0.5).slice(0, seedCount);
      const tags = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];
      const randomTag = () => tags[Math.floor(Math.random() * tags.length)];

      const results = await Promise.allSettled(
        shuffledSeeds.map(async (seed) => {
          const tag = randomTag();
          const prompt = `Dame UNA receta saludable y deliciosa de ${tag.toLowerCase()} con ${seed}. Varía el estilo de cocina (mediterránea, asiática, latinoamericana, etc.).`;
          const result = await processPrompt(prompt);
          if (result?.recipeData) {
            // ✅ Count each AI call toward daily limit
            incrementMessage();
            const kcalValue = result.recipeData.nutrition?.calories ?? Math.floor(Math.random() * 300 + 200);
            const timeValue = result.recipeData.time ? `${result.recipeData.time} min` : `${Math.floor(Math.random() * 20 + 5)} min`;
            return {
              name: result.recipeData.name || `Plato de ${seed}`,
              kcal: typeof kcalValue === 'number' ? kcalValue : parseInt(kcalValue) || 350,
              time: timeValue,
              tag,
              prompt,
              emoji: MEAL_EMOJIS[tag] || '🍴',
            } as AISuggestedRecipe;
          }
          return null;
        })
      );

      const valid = results
        .filter((r): r is PromiseFulfilledResult<AISuggestedRecipe | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((v): v is AISuggestedRecipe => v !== null);

      setAiSuggestions(valid);
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Generate on mount
  React.useEffect(() => {
    generateAISuggestions(false);
  }, []);

  const handleCategoryPress = async (category: typeof categories[0]) => {
    if (isMessageLimitReached) {
      Alert.alert("Límite de Chef IA", "Has agotado tus 5 mensajes diarios. Pásate al plan Pro para chatear sin límites con el Chef.");
      return;
    }

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
        incrementMessage();
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

  const handleRecipePress = async (recipe: AISuggestedRecipe) => {
    if (isMessageLimitReached) {
      Alert.alert("Límite de Chef IA", "Has agotado tus 5 mensajes diarios. Pásate al plan Pro para chatear sin límites con el Chef.");
      return;
    }

    setIsGenerating(true);
    setChatHistory(prev => [...prev, { role: 'user', message: `Quiero la receta completa de ${recipe.name}` }]);
    
    try {
      const result = await processPrompt(recipe.prompt);
      if (result && result.recipeData) {
        setGeneratedRecipe(result.recipeData);
        const friendlyMessage = result.response || `¡Aquí está la receta de ${recipe.name}! 🍽️`;
        setChatHistory(prev => [...prev, { role: 'ai', message: friendlyMessage }]);
        incrementMessage();
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
        {/* Tu Plan para Hoy Card - Dashboard Hook */}
        {profile?.nutritional_plan?.plan_nutricional && (
          <View style={styles.planCardContainer}>
            <LinearGradient
              colors={['#FBBF24', '#D97706']}
              style={styles.planCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.planHeader}>
                <View style={styles.planIconCircle}>
                  <Sparkles size={20} color="#000" fill="#000" />
                </View>
                <Text style={styles.planTitle}>Tu Plan Personalizado</Text>
              </View>

              <View style={styles.planStatsRow}>
                <View style={styles.planStatItem}>
                  <Text style={styles.planStatValue}>{profile.nutritional_plan.plan_nutricional.calorias_objetivo}</Text>
                  <Text style={styles.planStatLabel}>kcal/día</Text>
                </View>
                <View style={styles.planStatDivider} />
                <View style={styles.planStatItem}>
                  <Text style={styles.planStatValue}>{profile.nutritional_plan.plan_nutricional.macros.proteina_g}g</Text>
                  <Text style={styles.planStatLabel}>Proteína</Text>
                </View>
                <View style={styles.planStatDivider} />
                <View style={styles.planStatItem}>
                  <Text style={styles.planStatValue}>{profile.nutritional_plan.plan_nutricional.macros.carbos_g}g</Text>
                  <Text style={styles.planStatLabel}>Carbos</Text>
                </View>
              </View>

              <View style={styles.planInsightBox}>
                <BrainCircuit size={16} color="#000" />
                <Text style={styles.planInsightText} numberOfLines={2}>
                  {profile.nutritional_plan.estrategia_conductual.tip_motivacional_personalizado || "Confía en el proceso. Cada alimento registrado te acerca a tu meta."}
                </Text>
              </View>

              {/* 🏕️ WEEKEND SURVIVAL MODE */}
              {isWeekend && profile.nutritional_plan?.estrategia_conductual?.hack_fines_de_semana && (
                <View style={styles.weekendNoticeBox}>
                   <Zap size={14} color="#000" />
                   <Text style={styles.weekendNoticeText}>
                      Finde: {profile.nutritional_plan.estrategia_conductual.hack_fines_de_semana}
                   </Text>
                </View>
              )}

              {/* ✨ SAFETY BUFFER NOTICE ✨ */}
              {((profile.gender === 'female' && profile.nutritional_plan.plan_nutricional.calorias_objetivo <= 1200) || 
                (profile.gender === 'male' && profile.nutritional_plan.plan_nutricional.calorias_objetivo <= 1500)) && (
                <View style={styles.safetyNoticeBox}>
                   <Ionicons name="shield-checkmark" size={14} color="#000" />
                   <Text style={styles.safetyNoticeText}>
                     Ajustado por seguridad metabólica para evitar efecto rebote.
                   </Text>
                </View>
              )}

              <View style={styles.planMetaRow}>
                <TrendingUp size={14} color="rgba(0,0,0,0.6)" />
                <Text style={styles.planMetaText}>
                  Meta: {profile.nutritional_plan.plan_nutricional.fecha_meta_estimada}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

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
                  style={[styles.chatInput, isMessageLimitReached && { opacity: 0.5 }]}
                  placeholder={isMessageLimitReached ? "Límite diario alcanzado... 🔒" : "Tengo brócoli, pollo y arroz..."}
                  placeholderTextColor={isMessageLimitReached ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"}
                  value={chatInput}
                  onChangeText={setChatInput}
                  editable={!isMessageLimitReached}
                />
                <TouchableOpacity 
                  style={styles.sendBtn} 
                  disabled={loading || isGenerating}
                  onPress={async () => {
                    if (!chatInput.trim()) return;
                    if (isMessageLimitReached) {
                      Alert.alert("Límite de Chef IA", "Has agotado tus 5 mensajes diarios. Pásate al plan Pro para chatear sin límites con el Chef.");
                      return;
                    }
                    
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
                        incrementMessage();
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

        {/* Suggested Recipes - AI Dynamic */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Sugerencias para ti</Text>
            <View style={styles.aiPoweredBadge}>
              <Zap size={10} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.aiPoweredText}>Generado por IA · cambia cada vez</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, !isPro && styles.refreshBtnLocked]}
            onPress={() => generateAISuggestions(true)}
            disabled={loadingAI || isGenerating}
          >
            {loadingAI
              ? <ActivityIndicator size="small" color="#FBBF24" />
              : <>
                  {!isPro && <Text style={{ fontSize: 10, marginRight: 3 }}>🔒</Text>}
                  <Text style={styles.refreshBtnText}>{isPro ? '↻ Nuevas' : 'Pro'}</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Skeleton while loading */}
        {loadingAI && (
          [0, 1, 2].map((i) => (
            <View key={i} style={[styles.recipeCard, styles.skeleton]}>
              <View style={styles.skeletonIcon} />
              <View style={styles.recipeInfo}>
                <View style={[styles.skeletonLine, { width: '40%', marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: '70%', marginBottom: 6 }]} />
                <View style={[styles.skeletonLine, { width: '50%' }]} />
              </View>
            </View>
          ))
        )}

        {/* AI Generated Cards */}
        {!loadingAI && aiSuggestions.map((recipe, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.recipeCard}
            onPress={() => handleRecipePress(recipe)}
            disabled={isGenerating}
          >
            <View style={styles.recipeImagePlaceholder}>
              <Text style={{ fontSize: 28 }}>{recipe.emoji}</Text>
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
              <Sparkles color="#FBBF24" size={20} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Empty state */}
        {!loadingAI && aiSuggestions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🍽️</Text>
            <Text style={styles.emptyStateText}>No pudimos generar sugerencias.</Text>
            <TouchableOpacity onPress={() => generateAISuggestions(false)} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}

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
  aiPoweredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  aiPoweredText: {
    fontSize: 10,
    color: isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF',
    fontWeight: '600',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    minWidth: 80,
  },
  refreshBtnLocked: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  refreshBtnText: {
    color: '#FBBF24',
    fontWeight: '800',
    fontSize: 12,
  },
  skeleton: {
    opacity: 0.5,
  },
  skeletonIcon: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  },
  skeletonLine: {
    height: 11,
    borderRadius: 6,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  retryBtnText: {
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
  // --- Plan Card Styles ---
  planCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 10,
  },
  planCard: {
    borderRadius: 30,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  planIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  planStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  planStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  planStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
  },
  planStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  planStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  planInsightBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  planInsightText: {
    flex: 1,
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
    lineHeight: 18,
  },
  planMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
  },
  planMetaText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.6)',
  },
  safetyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  safetyNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
  weekendNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  weekendNoticeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    flex: 1,
  },
});

export default NoFatScreen;
