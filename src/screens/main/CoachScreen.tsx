import { useThemeColors } from '@/hooks/useThemeColors';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useCoachMessages, useSendMessage, useCoachInsights, useDailyTips, useMarkTipAsUsed, useClearChatHistory } from '@/hooks/useCoach';
import { useCoachMessage } from '@/hooks/useCoachMessage';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useProfile } from '@/hooks/useProfile';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MarkdownText from '@/components/MarkdownText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// No longer static, we use colors.accent from hook

export default function CoachScreen({ route }: any) {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const navigation = useNavigation();
  const { profile, nutritionGoals } = useProfile();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showFullHistory, setShowFullHistory] = useState(false);
  
  const { data: messages, isLoading: messagesLoading } = useCoachMessages(profile?.id || '');
  const { data: totals } = useDailyTotals(new Date());
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { mutate: clearChatHistory } = useClearChatHistory();

  // No longer clearing chat history on mount to preserve conversations
  
  const { isFriendly, triggerHaptic: coachHaptic } = useCoachMessage();

  const getDynamicRecommendation = () => {
    if (!profile || !totals) return "Cargando tus datos para darte la mejor recomendación...";
    
    const goals = nutritionGoals || { calories: 2000, protein: 150, carbs: 250, fat: 70 };
    const consumed = {
      calories: totals.calories || 0,
      protein: totals.protein || 0,
      carbs: totals.carbs || 0,
      fat: totals.fat || 0
    };

    const remaining = {
      calories: Math.max(0, goals.calories - consumed.calories),
      protein: Math.max(0, goals.protein - consumed.protein),
      carbs: Math.max(0, goals.carbs - consumed.carbs),
      fat: Math.max(0, goals.fat - consumed.fat)
    };

    if (consumed.calories === 0) {
      return isFriendly 
        ? `¡Hola, **${profile.first_name || 'campeón'}**! Qué alegría verte por aquí. ¿Qué tal si empezamos con un desayuno nutritivo hoy? ✨`
        : `¡Hola, **${profile.first_name || 'campeón'}**! Aún no has registrado nada hoy. Comienza con un desayuno rico en **proteína** para activar tu metabolismo. 🚀`;
    }

    if (remaining.calories < 100) {
      return isFriendly
        ? "¡Increíble! Has gestionado muy bien tus calorías hoy. Ahora enfócate en disfrutar de una buena **hidratación** para cerrar el día con broche de oro. ✅"
        : "Has alcanzado casi tu límite calórico de hoy. Te recomiendo enfocarte en **vegetales verdes** y mucha **hidratación** para lo que queda del día. ✅";
    }

    if (remaining.protein > 30) {
      return isFriendly
        ? `¡Vas genial! Solo nos faltan **${Math.round(remaining.protein)}g de proteína** para completar tu meta. ¿Qué te parece una cena ligera con algo de proteína? 🍗`
        : `He analizado tu día y te faltan **${Math.round(remaining.protein)}g de proteína** para llegar a tu meta. Una cena con pollo, pescado o legumbres sería ideal. 🍗`;
    }

    if (remaining.calories > 500) {
      return isFriendly
        ? `¡Qué buen balance! Aún tienes **${Math.round(remaining.calories)} kcal** para disfrutar de una comida completa. ¡Te lo has ganado! 🍱`
        : `Aún tienes **${Math.round(remaining.calories)} kcal** disponibles. ¡Es un buen momento para una comida balanceada que incluya carbohidratos complejos! 🍱`;
    }

    return "Vas por muy buen camino con tus objetivos. ¡Celebro tu constancia hoy! 🌟";
  };

  const isSubmitting = useRef(false);

  const handleSend = () => {
    if (!input.trim() || sending || isSubmitting.current) return;
    
    isSubmitting.current = true;
    sendMessage({ 
      content: input.trim(),
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'coach_screen'
      }
    }, {
      onSettled: () => {
        isSubmitting.current = false;
      }
    });
    coachHaptic();
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderFunctionalCards = () => {
    const goals = nutritionGoals || { calories: 2000, protein: 150 };
    const consumed = totals?.calories || 0;
    const remaining = Math.max(0, (goals.calories || 2000) - consumed);
    const proteinPct = totals?.protein && goals.protein ? Math.round((totals.protein / goals.protein) * 100) : 0;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.functionalCardsScroll}
        contentContainerStyle={styles.functionalCardsContent}
      >
        <TouchableOpacity style={styles.glassCard}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTag, { color: '#10B981' }]}>PROGRESO DEL DÍA</Text>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          </View>
          <Text style={styles.cardTitle}>{consumed.toLocaleString()} / {goals.calories?.toLocaleString()} kcal</Text>
          <Text style={styles.cardSubtitle}>{remaining.toLocaleString()} kcal restantes | proteínas: {proteinPct}% de meta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.glassCard}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTag, { color: '#EF4444' }]}>NUEVA RECETA</Text>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          </View>
          <Text style={styles.cardTitle}>Pancakes de Avena</Text>
          <Text style={styles.cardSubtitle}>Una opción saludable y deliciosa...</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.glassCard}>
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTag, { color: '#F59E0B' }]}>TIP DEL DÍA</Text>
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          </View>
          <Text style={styles.cardTitle}>Cafeína hasta...</Text>
          <Text style={styles.cardSubtitle}>La cafeína dura 6-8h en tu cuerpo...</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderRecipeCard = (recipe: any) => {
    if (!recipe) return null;
    
    return (
      <View style={styles.recipeCardContainer}>
        {/* Meal Type Header */}
        <View style={styles.recipeCardHeader}>
          <Text style={styles.recipeCardHeaderText}>🍽️ {recipe.mealType || 'Almuerzo'}</Text>
        </View>

        <View style={styles.recipeCardMain}>
          {/* Top Row: Image and Badges */}
          <View style={styles.recipeTopRow}>
            <View style={styles.recipeImageWrapper}>
              <Text style={{ fontSize: 44 }}>{recipe.icon || '🥗'}</Text>
            </View>
            <View style={styles.recipeMetaBadges}>
              <View style={styles.recipeTimeBadge}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.recipeTimeText}>{recipe.time || '15'} min</Text>
              </View>
              <View style={styles.recipeDifficultyBadge}>
                <Text style={styles.recipeDifficultyText}>{recipe.difficulty || 'Fácil'}</Text>
              </View>
            </View>
          </View>

          {/* Recipe Name */}
          <Text style={styles.recipeName}>{recipe.name}</Text>

          {/* Nutritional Badges Row 1 */}
          <View style={styles.nutrientBadgeRow}>
             <View style={[styles.nBadge, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="flame" size={12} color="#D97706" />
                <Text style={[styles.nBadgeText, { color: '#D97706' }]}>{recipe.nutrition?.calories || 0} kcal</Text>
             </View>
             <View style={[styles.nBadge, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="restaurant" size={12} color="#DC2626" />
                <Text style={[styles.nBadgeText, { color: '#DC2626' }]}>{recipe.nutrition?.protein || 0}g proteínas</Text>
             </View>
          </View>

          {/* Nutritional Badges Row 2 */}
          <View style={styles.nutrientBadgeRow}>
             <View style={[styles.nBadge, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="leaf" size={12} color="#B45309" />
                <Text style={[styles.nBadgeText, { color: '#B45309' }]}>{recipe.nutrition?.carbs || 0}g carbos</Text>
             </View>
             <View style={[styles.nBadge, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="water" size={12} color="#0284C7" />
                <Text style={[styles.nBadgeText, { color: '#0284C7' }]}>{recipe.nutrition?.fat || 0}g grasas</Text>
             </View>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
             {['alta proteína', 'digestivo', 'fresco'].map(tag => (
               <View key={tag} style={styles.softTag}>
                  <Text style={styles.softTagText}>{tag}</Text>
               </View>
             ))}
          </View>

          <View style={styles.cardDivider} />

          {/* Footer Action */}
          <TouchableOpacity 
            style={styles.fullRecipeLink}
            onPress={() => (navigation as any).navigate('RecipeDetail', { recipe })}
          >
            <Text style={styles.fullRecipeLinkText}>Ver receta completa</Text>
            <Ionicons name="arrow-forward" size={18} color="#92400E" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NotFat AI Coach</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.content}
          contentContainerStyle={styles.contentPadding}
          showsVerticalScrollIndicator={false}
        >
          {renderFunctionalCards()}

          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setShowRecommendations(!showRecommendations)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleGroup}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
                <Text style={styles.sectionTitle}>Recomendaciones IA</Text>
              </View>
              <Ionicons name={showRecommendations ? "chevron-up" : "chevron-down"} size={20} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            {showRecommendations && (
              <View style={styles.coachBubble}>
                <MarkdownText 
                  content={getDynamicRecommendation()}
                  style={styles.coachText}
                  boldStyle={styles.highlight}
                />
              </View>
            )}
          </View>

          {/* Chat History */}
          <View style={styles.chatHistory}>
            {messages && messages.filter(msg => {
              if (!msg.content) return false;
              const trimmed = msg.content.trim();
              if (trimmed.startsWith('{') || trimmed.includes('"title":') || trimmed.includes('"role":')) return false;
              return true;
            }).length > 4 && (
              <TouchableOpacity 
                style={styles.historyToggle} 
                onPress={() => {
                  setShowFullHistory(!showFullHistory);
                  coachHaptic();
                }}
              >
                <Ionicons 
                  name={showFullHistory ? "eye-off-outline" : "chatbubbles-outline"} 
                  size={14} 
                  color="rgba(255,255,255,0.4)" 
                />
                <Text style={styles.historyToggleText}>
                  {showFullHistory ? "Ocultar historial" : "Ver mensajes anteriores"}
                </Text>
              </TouchableOpacity>
            )}

            {messages?.filter(msg => {
              if (!msg.content) return false;
              const trimmed = msg.content.trim();
              if (trimmed.startsWith('{') || trimmed.includes('"title":') || trimmed.includes('"role":')) return false;
              return true;
            })
            .slice(showFullHistory ? 0 : -4) // Mostrar todo o solo los últimos 4
            .map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.role === 'user' ? styles.userRow : styles.coachRow,
                    msg.metadata?.recipeData ? { maxWidth: '95%' } : {}
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={styles.messageAvatarContainer}>
                      <Image source={require('../../../assets/icon.png')} style={{ width: 34, height: 34, borderRadius: 17 }} resizeMode="contain" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={[
                      styles.messageContainer,
                      msg.role === 'user' ? styles.userContainer : styles.assistantContainer,
                    ]}>
                      <MarkdownText 
                        content={(msg.content || '')
                          .replace(/```json[\s\S]*?```/g, '')
                          .replace(/{[\s\S]*?}/g, '')
                          .trim()}
                        style={msg.role === 'user' ? styles.userText : styles.assistantText}
                        boldStyle={msg.role === 'user' ? { fontWeight: '900', color: colors.accent } : { color: colors.accent, fontWeight: '800' }}
                      />
                    </View>
                    
                    {msg.metadata?.recipeData && (
                      <View style={{ marginTop: 12 }}>
                        {renderRecipeCard(msg.metadata.recipeData)}
                      </View>
                    )}
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>

        {/* Input Bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={10}>
          <View style={styles.inputArea}>
            <BlurView intensity={80} tint="dark" style={styles.inputBlurContainer}>
              <TouchableOpacity style={styles.accessoryButton}>
                <Ionicons name="barcode-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                placeholder="Pregúntale a tu Coach..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                selectionColor={colors.accent}
              />

              <TouchableOpacity style={styles.accessoryButton}>
                <Ionicons name="mic-outline" size={24} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="paper-plane" size={20} color="#000" />
                )}
              </TouchableOpacity>
            </BlurView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: 40,
  },
  functionalCardsScroll: {
    marginVertical: 10,
  },
  functionalCardsContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  glassCard: {
    width: '45%',
    minWidth: 150,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 16,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  coachBubble: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  coachText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#DDD',
  },
  highlight: {
    color: colors.accent,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  recipeCardContainer: {
    marginVertical: 10,
    width: '100%',
  },
  recipeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
  },
  recipeCardHeaderText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    fontFamily: FONTS.primary,
  },
  recipeCardMain: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recipeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recipeImageWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recipeMetaBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  recipeTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  recipeTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  recipeDifficultyBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  recipeDifficultyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  recipeName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: FONTS.primary,
    letterSpacing: -0.5,
  },
  nutrientBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  nBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  nBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  softTag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  softTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
    marginBottom: 12,
  },
  fullRecipeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  fullRecipeLinkText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.accent,
  },
  chatHistory: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 20,
    maxWidth: '85%',
  },
  coachRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
  },
  userRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  messageAvatar: {
    fontSize: 18,
  },
  messageAvatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  messageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    maxWidth: '100%',
  },
  assistantContainer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderTopRightRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  historyToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  assistantText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  inputArea: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  inputBlurContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  accessoryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  textInput: {
    flex: 1,
    height: 44,
    color: '#FFF',
    paddingHorizontal: 12,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
