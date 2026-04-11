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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useCoachMessages, useSendMessage, useCoachInsights, useDailyTips, useMarkTipAsUsed, useClearChatHistory } from '@/hooks/useCoach';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useProfile } from '@/hooks/useProfile';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MarkdownText from '@/components/MarkdownText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACCENT_COLOR = '#FBBF24'; // Amber

export default function CoachScreen({ route }: any) {
  const { colors, isDark } = useThemeColors();
  const styles = React.useMemo(() => getStyles(colors, true), [colors]); // Force dark mode aesthetics

  const navigation = useNavigation();
  const { profile } = useProfile();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  
  const { data: messages, isLoading: messagesLoading } = useCoachMessages(profile?.id || '');
  const { data: totals } = useDailyTotals(new Date());
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { mutate: clearChatHistory } = useClearChatHistory();

  // Clear chat history when screen loads (fresh session)
  useEffect(() => {
    // Only clear on mount, not on every re-render
    if (profile?.id && !messagesLoading) {
      clearChatHistory();
    }
  }, []);

  const getDynamicRecommendation = () => {
    if (!profile || !totals) return "Cargando tus datos para darte la mejor recomendación...";
    
    const goals = profile.nutrition_goals || { calories: 2000, protein: 150, carbs: 250, fat: 70 };
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
      return `¡Hola, **${profile.first_name || 'campeón'}**! Aún no has registrado nada hoy. Comienza con un desayuno rico en **proteína** para activar tu metabolismo. 🚀`;
    }

    if (remaining.calories < 100) {
      return "Has alcanzado casi tu límite calórico de hoy. Te recomiendo enfocarte en **vegetales verdes** y mucha **hidratación** para lo que queda del día. ✅";
    }

    if (remaining.protein > 30) {
      return `He analizado tu día y te faltan **${Math.round(remaining.protein)}g de proteína** para llegar a tu meta. Una cena con pollo, pescado o legumbres sería ideal. 🍗`;
    }

    if (remaining.calories > 500) {
      return `Aún tienes **${Math.round(remaining.calories)} kcal** disponibles. ¡Es un buen momento para una comida balanceada que incluya carbohidratos complejos! 🍱`;
    }

    return "Vas por muy buen camino con tus objetivos. ¡Sigue así y no olvides registrar tu próxima comida! 🌟";
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
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderFunctionalCards = () => {
    const goals = profile?.nutrition_goals || { calories: 2000, protein: 150 };
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
      <View style={styles.premiumRecipeCard}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.recipeHeader}>
          <View style={styles.recipeImageWrapper}>
            <Text style={{ fontSize: 44 }}>🥗</Text>
          </View>
          <View style={styles.recipeMetaBadges}>
            <View style={styles.recipeBadge}>
              <Ionicons name="time-outline" size={14} color={ACCENT_COLOR} />
              <Text style={styles.recipeBadgeText}>{recipe.time || '15'} min</Text>
            </View>
            <View style={styles.recipeBadge}>
              <Ionicons name="flash-outline" size={14} color={ACCENT_COLOR} />
              <Text style={styles.recipeBadgeText}>{recipe.difficulty || 'Fácil'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.recipeName}>{recipe.name}</Text>

        <View style={styles.nutrientGrid}>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientVal}>{recipe.nutrition?.calories || 0}</Text>
            <Text style={styles.nutrientLabel}>KCAL</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientVal}>{recipe.nutrition?.protein || 0}g</Text>
            <Text style={styles.nutrientLabel}>PROT</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientVal}>{recipe.nutrition?.carbs || 0}g</Text>
            <Text style={styles.nutrientLabel}>CARB</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientVal}>{recipe.nutrition?.fat || 0}g</Text>
            <Text style={styles.nutrientLabel}>FAT</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('RecipeDetail' as never, { recipe } as never)}
        >
          <Text style={styles.actionButtonText}>Ver receta completa</Text>
          <Ionicons name="arrow-forward" size={16} color="#000" />
        </TouchableOpacity>
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
          <View style={styles.profileCircle}>
            <Text style={{ fontSize: 22 }}>🦦</Text>
          </View>
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
                <Ionicons name="sparkles" size={18} color={ACCENT_COLOR} />
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
            {messages?.filter(msg => {
              if (!msg.content) return false;
              const trimmed = msg.content.trim();
              if (trimmed.startsWith('{') || trimmed.includes('"title":') || trimmed.includes('"role":')) return false;
              return true;
            })
            .slice(-6) // Mantener solo las últimas 3 conversaciones (6 mensajes)
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
                    <View style={styles.assistantAvatarContainer}>
                      <Text style={styles.messageAvatar}>🦦</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={[
                      styles.messageContainer,
                      msg.role === 'user' ? styles.userContainer : styles.assistantContainer,
                    ]}>
                      <MarkdownText 
                        content={msg.content}
                        style={msg.role === 'user' ? styles.userText : styles.assistantText}
                        boldStyle={msg.role === 'user' ? { fontWeight: '900', color: ACCENT_COLOR } : { color: ACCENT_COLOR, fontWeight: '800' }}
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
                selectionColor={ACCENT_COLOR}
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
    width: 200,
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
    color: ACCENT_COLOR,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  premiumRecipeCard: {
    borderRadius: 28,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recipeImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  recipeMetaBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  recipeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recipeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  recipeName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 15,
    letterSpacing: -0.4,
  },
  nutrientGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  nutrientLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    fontWeight: '800',
  },
  actionButton: {
    backgroundColor: ACCENT_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
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
    backgroundColor: ACCENT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
