import React, { useState, useRef } from 'react';
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

export default function CoachScreenNew() {
  const navigation = useNavigation();
  const { profile } = useProfile();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  
  const { data: messages, isLoading: messagesLoading } = useCoachMessages(profile?.id || '');
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { data: insights } = useCoachInsights(profile?.id || '');
  const { data: dailyTips } = useDailyTips();
  const { mutate: markTipAsUsed } = useMarkTipAsUsed();

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText?.trim() || sending) return;
    
    sendMessage({ 
      content: messageText.trim(),
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'coach_screen'
      }
    });
    if (!text) setInput('');
    
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

  const renderInsight = (insight: any) => (
    <View key={insight.id} style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Ionicons name="bulb" size={20} color={COLORS.primary.amber} />
        <Text style={styles.insightTitle}>Insight Personalizado</Text>
      </View>
      <Text style={styles.insightText}>
        {typeof insight.insights === 'string' 
          ? insight.insights 
          : JSON.stringify(insight.insights)}
      </Text>
      <Text style={styles.insightTime}>
        {new Date(insight.generated_at).toLocaleDateString('es-CL')}
      </Text>
    </View>
  );

  const renderTip = (tip: any) => (
    <View key={tip.id} style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <Text style={styles.tipEmoji}>{tip.emoji}</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipCategory}>{tip.category}</Text>
        </View>
        <TouchableOpacity 
          style={styles.tipUseButton}
          onPress={() => markTipAsUsed(tip.id)}
        >
          <Ionicons name="checkmark" size={16} color={COLORS.background.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.tipDescription}>{tip.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary.amber} />
        </TouchableOpacity>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>🦦</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.coachName}>NotFat Coach</Text>
          <Text style={styles.coachStatus}>● En línea</Text>
        </View>
      </View>

      {/* Messages Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        {(!messages || (messages?.length === 0)) && (
          <View style={styles.welcomeMessage}>
            <Text style={styles.welcomeText}>
              ¡Hola! 🦦 Soy tu Coach NotFat. ¿En qué puedo ayudarte hoy?
            </Text>
          </View>
        )}

        {/* Messages */}
        {messages?.map(renderMessage)}

        {/* Loading Indicator */}
        {sending && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator size="small" color={COLORS.primary.amber} />
            <Text style={styles.loadingText}>Pensando...</Text>
          </View>
        )}

        {/* Insights */}
        {(insights && insights?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insights para Ti</Text>
            {insights.slice(0, 2).map(renderInsight)}
          </View>
        )}

        {/* Daily Tips */}
        {(dailyTips && dailyTips?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips del Día</Text>
            {dailyTips.slice(0, 2).map(renderTip)}
          </View>
        )}
      </ScrollView>

      {/* Quick Suggestions */}
      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {QUICK_SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSend(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor={COLORS.text.secondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.background.primary} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.background.primary} />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: SPACING.md,
  },
  backBtn: {
    padding: SPACING.sm,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  coachStatus: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.status.success,
    fontFamily: FONTS.primary,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.lg,
  },
  welcomeMessage: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.2)',
  },
  welcomeText: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    lineHeight: 22,
  },
  messageContainer: {
    marginBottom: SPACING.md,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  coachMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  userBubble: {
    backgroundColor: COLORS.primary.amber,
    borderBottomRightRadius: BORDER_RADIUS.sm,
  },
  coachBubble: {
    backgroundColor: COLORS.background.secondary,
    borderBottomLeftRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  messageText: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  userText: {
    color: COLORS.background.primary,
  },
  coachText: {
    color: COLORS.text.primary,
  },
  messageTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    marginBottom: SPACING.md,
  },
  insightCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.1)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  insightTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary.amber,
    fontFamily: FONTS.primary,
  },
  insightText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  insightTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.muted,
    fontFamily: FONTS.primary,
  },
  tipCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  tipCategory: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text.secondary,
    fontFamily: FONTS.primary,
  },
  tipUseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    lineHeight: 20,
  },
  suggestionsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionChip: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
  },
  inputContainer: {
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    color: COLORS.text.primary,
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
