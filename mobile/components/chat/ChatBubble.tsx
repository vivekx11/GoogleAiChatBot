/**
 * ChatBubble — Individual message bubble
 * User messages: right-aligned cyan
 * AI messages: left-aligned purple
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Message } from '../../store/chatStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { speak } from '../../services/runanywhereService';
import { Ionicons } from '@expo/vector-icons';

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  // Clean action JSON from display text
  const displayText = message.content
    .replace(/\{[^}]*"action"[^}]*\}/g, '')
    .trim();

  const handleSpeak = () => {
    speak(displayText);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      {/* Avatar */}
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
          {displayText}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.time}>{formatTime(message.created_at)}</Text>
          {!isUser && (
            <TouchableOpacity onPress={handleSpeak} style={styles.speakBtn}>
              <Ionicons name="volume-medium-outline" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* User avatar */}
      {isUser && (
        <View style={[styles.avatar, styles.userAvatar]}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(123,47,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    backgroundColor: 'rgba(0,212,255,0.15)',
  },
  avatarText: { fontSize: 16 },
  bubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  userBubble: {
    backgroundColor: Colors.bubbleUser,
    borderWidth: 1,
    borderColor: Colors.bubbleUserBorder,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.bubbleAI,
    borderWidth: 1,
    borderColor: Colors.bubbleAIBorder,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: Typography.base,
    lineHeight: 22,
  },
  userText: {
    color: Colors.textPrimary,
  },
  aiText: {
    color: Colors.textPrimary,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.xs,
    color: Colors.warning,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  time: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  speakBtn: {
    padding: 2,
  },
});
