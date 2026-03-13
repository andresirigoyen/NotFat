import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ghost, Sparkles, Send, Utensils, Zap, ChefHat, Salad, Coffee } from 'lucide-react-native';
import { useAIChat } from '@/hooks/useAIChat';

const { width } = Dimensions.get('window');

const NoFatScreen = () => {
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

  const categories = [
    { label: 'Desayunos', icon: <Coffee size={20} color="#7c2d12" />, color: '#fef3c7' },
    { label: 'Almuerzos', icon: <ChefHat size={20} color="#7c2d12" />, color: '#dcfce7' },
    { label: 'Cenas', icon: <Utensils size={20} color="#7c2d12" />, color: '#fee2e2' },
    { label: 'Snacks', icon: <Salad size={20} color="#7c2d12" />, color: '#e0f2fe' },
  ];

  const suggestedRecipes = [
    { name: 'Bowl de Avena y Chía', kcal: 320, time: '10 min', tag: 'Desayuno' },
    { name: 'Salmón con Espárragos', kcal: 450, time: '20 min', tag: 'Almuerzo' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandEmoji}>🦦</Text>
            <Text style={styles.brandText}>NotFat Chef</Text>
          </View>
          <View style={styles.aiBadge}>
            <Sparkles color="#7c2d12" size={14} fill="#7c2d12" />
            <Text style={styles.aiBadgeText}>Powered by Gemini</Text>
          </View>
        </View>

        {/* AI Chat Intro Card */}
        <LinearGradient
          colors={['#7c2d12', '#451a03']}
          style={styles.chatIntroCard}
        >
          <Ghost color="#ffffff" size={40} style={styles.ghostIcon} />
          <Text style={styles.chatTitle}>¿Qué cocinamos hoy?</Text>
          <Text style={styles.chatSubtitle}>Dime qué ingredientes tienes y te crearé una receta saludable personalizada.</Text>
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Tengo brócoli, pollo y arroz..."
              placeholderTextColor="rgba(255,255,255,0.5)"
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
                  // Usar el endpoint unificado processPrompt
                  const result = await processPrompt(userMessage);
                  
                  if (result) {
                    if (result.type === 'recipe' && result.recipeData) {
                      setGeneratedRecipe(result.recipeData);
                      setChatHistory(prev => [...prev, { 
                        role: 'ai', 
                        message: result.response || '¡He creado una receta deliciosa para ti!'
                      }]);
                    } else {
                      // Es solo chat, limpiamos la receta anterior de la pantalla
                      setGeneratedRecipe(null);
                      setChatHistory(prev => [...prev, { 
                        role: 'ai', 
                        message: result.response 
                      }]);
                    }
                  }
                } catch (err) {
                  console.error("Fallo al enviar mensaje:", err);
                } finally {
                  setIsGenerating(false);
                }
              }}
            >
              {loading || isGenerating ? <ActivityIndicator color="#7c2d12" size="small" /> : <Send color="#7c2d12" size={20} />}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <View style={styles.chatHistory}>
                {chatHistory.map((msg, idx) => (
                  <View key={idx} style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.aiBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userText : styles.aiText
                    ]}>
                      {msg.message}
                    </Text>
                  </View>
                ))}
          </View>
        )}

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
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              {generatedRecipe.ingredients?.map((ingredient: string, idx: number) => (
                <Text key={idx} style={styles.ingredientItem}>• {ingredient}</Text>
              ))}
            </View>
            
            <View style={styles.instructionsSection}>
              <Text style={styles.sectionTitle}>Preparacion</Text>
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
            <TouchableOpacity key={idx} style={[styles.catCard, { backgroundColor: cat.color }]}>
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
          <TouchableOpacity key={idx} style={styles.recipeCard}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3ED',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandEmoji: {
    fontSize: 32,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#7c2d12',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#7c2d12',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c2d12',
    textTransform: 'uppercase',
  },
  chatIntroCard: {
    padding: 32,
    borderRadius: 36,
    marginBottom: 32,
    shadowColor: '#7c2d12',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ghostIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  chatTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
  },
  chatSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '600',
  },
  chatInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 8,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    height: 50,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  catScroll: {
    marginBottom: 32,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  catCard: {
    width: 120,
    height: 120,
    borderRadius: 28,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    gap: 8,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7c2d12',
  },
  seeAll: {
    color: '#7c2d12',
    fontWeight: '800',
    fontSize: 14,
  },
  recipeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  tag: {
    backgroundColor: '#FAF3ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c2d12',
    textTransform: 'uppercase',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  recipeStats: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  favBtn: {
    padding: 8,
  },
  // Chat styles
  chatHistory: {
    marginBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#7c2d12',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#1e293b',
  },
  // Recipe styles
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeTime: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
  },
  nutritionInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
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
    fontSize: 20,
    fontWeight: '900',
    color: '#7c2d12',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  ingredientItem: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 4,
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionItem: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 8,
  },
});

export default NoFatScreen;
