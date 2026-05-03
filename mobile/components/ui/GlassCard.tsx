/**
 * GlassCard — Glassmorphism card component
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
