/**
 * StatusBadge — Shows current voice assistant state
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants/theme';
import { VoiceState } from '../../store/voiceStore';

const STATE_CONFIG: Record<VoiceState, { label: string; color: string; dot: string }> = {
  idle: { label: 'Ready', color: Colors.success, dot: Colors.success },
  listening: { label: 'Listening', color: Colors.micActive, dot: Colors.micActive },
  processing: { label: 'Processing', color: Colors.warning, dot: Colors.warning },
  speaking: { label: 'Speaking', color: Colors.secondary, dot: Colors.secondary },
  error: { label: 'Error', color: Colors.error, dot: Colors.error },
};

export function StatusBadge({ state }: { state: VoiceState }) {
  const config = STATE_CONFIG[state];

  return (
    <View style={[styles.badge, { borderColor: `${config.color}40` }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
