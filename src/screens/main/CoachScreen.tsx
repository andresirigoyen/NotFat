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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

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
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    from: 'coach',
    text: '¡Hola! 🦦 Soy tu Coach Nutria. ¿Qué quieres cocinar hoy con lo que tienes en tu nevera?',
  },
];

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), from: 'user', text: text.trim() };
    const coachReply: Message = {
      id: (Date.now() + 1).toString(),
      from: 'coach',
      text: '🦦 Dame un momento, estoy analizando lo que tienes en tu despensa...',
    };
    setMessages((prev) => [...prev, userMsg, coachReply]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>🦦</Text>
        </View>
        <View>
          <Text style={styles.coachName}>Nutria Coach</Text>
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
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.from === 'user' ? styles.userBubble : styles.coachBubble,
            ]}
          >
            {msg.from === 'coach' && <Text style={styles.coachEmoji}>🦦</Text>}
            <Text
              style={[
                styles.bubbleText,
                msg.from === 'user' ? styles.userText : styles.coachText,
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}

        {/* Quick Suggestions */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Sugerencias rápidas</Text>
            <View style={styles.suggestionsRow}>
              {QUICK_SUGGESTIONS.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(sug)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={18} color={input.trim() ? COLORS.background.primary : '#333'} />
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: SPACING.md,
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
    padding: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  bubble: {
    maxWidth: '82%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
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
  bubbleText: {
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.primary,
    lineHeight: 20,
  },
  coachText: {
    backgroundColor: '#1E1E1E',
    color: COLORS.text.primary,
    borderBottomLeftRadius: 4,
  },
  userText: {
    backgroundColor: COLORS.primary.amber,
    color: COLORS.background.primary,
    fontWeight: '600',
    borderBottomRightRadius: 4,
  },
  suggestionsContainer: {
    marginTop: SPACING.xl,
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
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: COLORS.background.primary,
    gap: SPACING.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 11,
    color: COLORS.text.primary,
    fontFamily: FONTS.primary,
    fontSize: FONTS.sizes.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1E1E1E',
  },
});
