/**
 * Jarvis Design System — Futuristic Dark Theme
 * Glassmorphism + Neon accents
 */

export const Colors = {
  // Primary palette
  primary: '#00d4ff',       // Cyan neon
  primaryDim: '#0099bb',
  secondary: '#7b2fff',     // Purple accent
  accent: '#ff6b35',        // Orange highlight

  // Backgrounds
  bg: '#050510',            // Deep space black
  bgCard: 'rgba(255,255,255,0.05)',  // Glass card
  bgCardBorder: 'rgba(0,212,255,0.15)',
  bgInput: 'rgba(255,255,255,0.08)',
  bgOverlay: 'rgba(0,0,0,0.7)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#8892a4',
  textMuted: '#4a5568',
  textAccent: '#00d4ff',

  // Status
  success: '#00ff88',
  warning: '#ffcc00',
  error: '#ff4444',
  info: '#00d4ff',

  // Chat bubbles
  bubbleUser: 'rgba(0,212,255,0.15)',
  bubbleUserBorder: 'rgba(0,212,255,0.4)',
  bubbleAI: 'rgba(123,47,255,0.12)',
  bubbleAIBorder: 'rgba(123,47,255,0.3)',

  // Gradients (use with LinearGradient)
  gradientPrimary: ['#00d4ff', '#7b2fff'] as const,
  gradientBg: ['#050510', '#0a0a2e'] as const,
  gradientCard: ['rgba(0,212,255,0.1)', 'rgba(123,47,255,0.05)'] as const,

  // Mic button
  micActive: '#ff4444',
  micIdle: '#00d4ff',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
  hero: 42,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadows = {
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  glowPurple: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
