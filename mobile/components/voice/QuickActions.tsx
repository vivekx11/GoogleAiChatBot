/**
 * QuickActions — Shortcut buttons for common voice commands
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useVoiceStore } from '../../store/voiceStore';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

const QUICK_COMMANDS = [
  { label: '🌤️ Weather', command: "What's the weather today?" },
  { label: '📰 News', command: "Tell me today's top news" },
  { label: '💬 WhatsApp', command: 'Open WhatsApp' },
  { label: '🎵 Spotify', command: 'Open Spotify' },
  { label: '▶️ YouTube', command: 'Open YouTube' },
  { label: '🔍 Search', command: 'Search Google' },
];

export function QuickActions() {
  const { processTextCommand, state } = useVoiceStore();
  const { user } = useAuthStore();
  const isDisabled = state !== 'idle' && state !== 'error';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Commands</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {QUICK_COMMANDS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.chip, isDisabled && styles.chipDisabled]}
            onPress={() => processTextCommand(item.command, user?.language || 'en')}
            disabled={isDisabled}
            accessibilityLabel={`Quick command: ${item.command}`}
          >
            <Text style={styles.chipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: Spacing.md,
  },
  title: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  scroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
});
