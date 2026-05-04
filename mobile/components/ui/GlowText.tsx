/**
 * GlowText — Text with neon glow effect
 */
//--------------------------------------
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

interface GlowTextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  color?: string;
}

export function GlowText({ children, style, color = Colors.primary }: GlowTextProps) {
  return (
    <Text
      style={[
        styles.glow,
        { color, textShadowColor: color },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  glow: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
