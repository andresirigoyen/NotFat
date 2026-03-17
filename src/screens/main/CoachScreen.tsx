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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useCoachMessages, useSendMessage, useCoachInsights, useDailyTips, useMarkTipAsUsed } from '@/hooks/useCoach';
import { useProfile } from '@/hooks/useProfile';

const QUICK_SUGGESTIONS = [
  'Receta alta en proteína',
  'Cena ligera',
  '¿Qué como si me duele la cabeza?',
  'Algo rápido para antes de entrenar',
];

type Message = {
  id: string;
  from: 'coach' | 'user';
  text: string;
  type?: 'chat' | 'recipe';
  recipeData?: any;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    from: 'coach',
    text: '¡Hola! 🦦 Soy tu Coach NotFat. ¿Qué quieres cocinar hoy con lo que tienes en tu nevera?',
  },
];

export default function CoachScreen({ route }: any) {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  
  const { data: messages, isLoading: messagesLoading } = useCoachMessages(profile?.id || '');
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { data: insights } = useCoachInsights(profile?.id || '');
  const { data: dailyTips } = useDailyTips();
  const { mutate: markTipAsUsed } = useMarkTipAsUsed();

  // If we receive an initialMessage from deep link (e.g. processed_intake alert), prefill input and send once.
  useEffect(() => {
    const initialMessage = route?.params?.initialMessage as string | undefined;
    if (initialMessage && initialMessage.trim()) {
      setInput(initialMessage);
      // Auto-enviar una sola vez y limpiar el parámetro para no repetir al volver.
      sendMessage({
        content: initialMessage.trim(),
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'coach_deeplink_processed_intake',
        },
      });
      // Limpia el param localmente
      route.params = { ...route.params, initialMessage: undefined };
    }
  }, [route?.params?.initialMessage]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    
    sendMessage({ 
      content: input.trim(),
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'coach_screen'
      }
    });
    setInput('');
    
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = (message: any) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.role === 'user' ? styles.userMessage : styles.coachMessage
    ]}>
      <View style={[
        styles.messageBubble,
        message.role === 'user' ? styles.userBubble : styles.coachBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.role === 'user' ? styles.userText : styles.coachText
        ]}>
          {message.content}
        </Text>
        <Text style={styles.messageTime}>
          {new Date(message.created_at).toLocaleTimeString('es-CL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>🦦</Text>
        </View>
        <View>
          <Text style={styles.coachName}>NotFat Coach</Text>
          <Text style={styles.coachStatus}>● En línea</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages?.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.coachBubble,
            ]}
          >
            {msg.role === 'assistant' && <Text style={styles.coachEmoji}>🦦</Text>}
            <View style={Object.assign({}, styles.bubbleTextContainer, msg.role === 'user' ? styles.userText : styles.coachText)}>
              <Text
                style={Object.assign({}, styles.bubbleText, msg.role === 'user' ? styles.userTextContent : styles.coachTextContent)}
              >
                {msg.content}
              </Text>
              
              {msg.metadata?.type === 'recipe' && msg.metadata?.recipeData && (
                <View style={styles.recipePreview}>
                  <Text style={styles.recipeTitle}>{msg.metadata.recipeData.name}</Text>
                  <Text style={styles.recipeDescription}>{msg.metadata.recipeData.description}</Text>
                  <View style={styles.recipeMeta}>
                    <Text style={styles.recipeMetaText}>⏱️ {msg.metadata.recipeData.time} min</Text>
                    <Text style={styles.recipeMetaText}>🔥 {msg.metadata.recipeData.nutrition?.calories} kcal</Text>
                  </View>
                  <TouchableOpacity style={styles.viewRecipeButton}>
                    <Text style={styles.viewRecipeText}>Ver receta completa</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}

        {sending && (
          <View style={[styles.bubble, styles.coachBubble]}>
            <Text style={styles.coachEmoji}>🦦</Text>
            <View style={Object.assign({}, styles.bubbleTextContainer, styles.coachText, { paddingVertical: SPACING.md })}>
              <ActivityIndicator color={COLORS.primary.amber} size="small" />
            </View>
          </View>
        )}

        {/* Quick Suggestions */}
        {(!messages || messages?.length <= 1) && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Sugerencias rápidas</Text>
            <View style={styles.suggestionsRow}>
              {QUICK_SUGGESTIONS.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage({ content: sug })}
                  activeOpacity={0.7}
                  disabled={sending}
                >
                  <Text style={styles.suggestionText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={22} color={COLORS.text.secondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Escríbele a tu Coach..."
            placeholderTextColor="#555"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage({ content: input })}
            returnKeyType="send"
            multiline
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
            onPress={() => sendMessage({ content: input })}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Ionicons name="send" size={18} color={input.trim() ? COLORS.background.primary : '#333'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: SPACING.sm,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(252,211,77,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary.amber,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  coachName: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  coachStatus: {
    fontSize: FONTS.sizes.xs,
    color: '#34D399',
    fontFamily: FONTS.primary,
    marginTop: 1,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bubble: {
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  coachBubble: {
    alignSelf: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  coachEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  bubbleTextContainer: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    overflow: 'hidden',
  },
  bubbleText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    lineHeight: 20,
  },
  coachText: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 4,
  },
  coachTextContent: {
    color: COLORS.text.primary,
  },
  userText: {
    backgroundColor: COLORS.primary.amber,
    borderBottomRightRadius: 4,
  },
  userTextContent: {
    color: COLORS.background.primary,
    fontWeight: '600',
  },
  recipePreview: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  recipeTitle: {
    color: COLORS.primary.amber,
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    fontFamily: FONTS.primary,
    marginBottom: 4,
  },
  recipeDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  recipeMetaText: {
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.primary,
    fontWeight: '600',
  },
  viewRecipeButton: {
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.2)',
  },
  viewRecipeText: {
    color: COLORS.primary.amber,
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    fontFamily: FONTS.primary,
  },
  suggestionsContainer: {
    marginTop: SPACING.md,
  },
  suggestionsTitle: {
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.md,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestionChip: {
    backgroundColor: 'rgba(252,211,77,0.1)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.25)',
  },
  suggestionText: {
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: COLORS.background.primary,
    gap: SPACING.xs,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1E1E1E',
  },
  messageContainer: {
    marginBottom: SPACING.md,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  coachMessage: {
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  messageTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
  },
});
