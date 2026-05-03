/**
 * Chat Screen — ChatGPT-style AI conversation
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, Message } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useVoiceStore } from '../../store/voiceStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GlowText } from '../../components/ui/GlowText';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { SessionDrawer } from '../../components/chat/SessionDrawer';
import { speak } from '../../services/runanywhereService';
import { executeAction } from '../../services/appControl';
import { ModelSetupBanner } from '../../components/ui/ModelSetupBanner';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { user, settings } = useAuthStore();
  const { messages, isSending, currentSessionId, sendMessage, createSession, clearMessages } = useChatStore();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setInput('');

    try {
      const aiContent = await sendMessage(text, user?.language || 'en');

      // Auto-read response if enabled
      if (settings?.auto_read_response) {
        await speak(aiContent, {
          rate: settings?.voice_speed || 1.0,
          pitch: settings?.voice_pitch || 1.0,
        });
      }
    } catch (err) {
      // Error handled in store
    }
  };

  const handleNewChat = async () => {
    clearMessages();
    await createSession();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble message={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🤖</Text>
      <GlowText style={styles.emptyTitle}>Jarvis AI</GlowText>
      <Text style={styles.emptySubtitle}>
        Ask me anything — weather, news, tasks, or just chat.
      </Text>
      <View style={styles.suggestions}>
        {[
          "What's the weather today?",
          "Tell me today's top news",
          "Open WhatsApp",
          "Set a reminder for 5 PM",
        ].map((suggestion) => (
          <TouchableOpacity
            key={suggestion}
            style={styles.suggestionChip}
            onPress={() => setInput(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={Colors.gradientBg} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowSessions(true)} style={styles.headerBtn}>
            <Ionicons name="menu" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🤖 Jarvis</Text>
            <View style={styles.onlineDot} />
          </View>

          <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          ListHeaderComponent={<ModelSetupBanner requires={['llm']} />}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {isSending && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>Jarvis is thinking...</Text>
          </View>
        )}

        {/* Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Message Jarvis..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isSending}
              accessibilityLabel="Send message"
            >
              <Ionicons
                name="send"
                size={20}
                color={input.trim() && !isSending ? Colors.bg : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Session Drawer */}
        <SessionDrawer
          visible={showSessions}
          onClose={() => setShowSessions(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.1)',
  },
  headerBtn: {
    padding: Spacing.xs,
    width: 40,
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  messageList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  suggestions: {
    width: '100%',
    gap: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  suggestionText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  typingText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingBottom: 70,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.1)',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.bgInput,
  },
});
