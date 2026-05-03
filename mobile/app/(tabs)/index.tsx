/**
 * Voice Assistant Screen — Main Jarvis interface
 * Floating mic button, waveform animation, command display
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceStore } from '../../store/voiceStore';
import { useAuthStore } from '../../store/authStore';
import { useAutomationStore } from '../../store/automationStore';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { GlowText } from '../../components/ui/GlowText';
import { GlassCard } from '../../components/ui/GlassCard';
import { VoiceWaveform } from '../../components/voice/VoiceWaveform';
import { StatusBadge } from '../../components/voice/StatusBadge';
import { QuickActions } from '../../components/voice/QuickActions';
import { ModelSetupBanner } from '../../components/ui/ModelSetupBanner';

const { width } = Dimensions.get('window');

export default function VoiceScreen() {
  const { user, settings } = useAuthStore();
  const {
    state,
    transcript,
    response,
    intent,
    error,
    startListening,
    stopListening,
    cancelListening,
    clearError,
  } = useVoiceStore();
  const { checkTrigger, load: loadAutomations } = useAutomationStore();

  // Pulse animation for mic button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAutomations();
  }, []);

  useEffect(() => {
    if (state === 'listening') {
      // Pulse animation while recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    }
  }, [state]);

  const handleMicPress = async () => {
    if (state === 'listening') {
      await stopListening(user?.language || 'en');
    } else if (state === 'idle' || state === 'error') {
      clearError();
      await startListening();
    }
  };

  const handleMicLongPress = async () => {
    if (state === 'listening') {
      await cancelListening();
    }
  };

  const isActive = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';

  const micColor = isActive ? Colors.micActive : Colors.micIdle;

  return (
    <LinearGradient colors={Colors.gradientBg} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <GlowText style={styles.greeting}>
              Hello, {user?.name?.split(' ')[0] || 'User'} 👋
            </GlowText>
            <Text style={styles.subGreeting}>How can I help you today?</Text>
          </View>
          <StatusBadge state={state} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Model download banner — shown until all models are ready */}
          <ModelSetupBanner requires={['llm', 'stt', 'tts']} />
          {/* Waveform / Orb */}
          <View style={styles.orbContainer}>
            <VoiceWaveform state={state} />
          </View>

          {/* Status Text */}
          <Text style={styles.statusText}>
            {state === 'idle' && 'Tap the mic to speak'}
            {state === 'listening' && 'Listening... tap to stop'}
            {state === 'processing' && 'Processing your command...'}
            {state === 'speaking' && 'Speaking...'}
            {state === 'error' && (error || 'Something went wrong')}
          </Text>

          {/* Transcript */}
          {transcript ? (
            <GlassCard style={styles.transcriptCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="person" size={14} color={Colors.primary} />
                <Text style={styles.cardLabel}>You said</Text>
              </View>
              <Text style={styles.transcriptText}>{transcript}</Text>
              {intent && (
                <View style={styles.intentBadge}>
                  <Text style={styles.intentText}>Intent: {intent}</Text>
                </View>
              )}
            </GlassCard>
          ) : null}

          {/* AI Response */}
          {response ? (
            <GlassCard style={styles.responseCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.jarvisIcon}>🤖</Text>
                <Text style={styles.cardLabel}>Jarvis</Text>
              </View>
              <Text style={styles.responseText}>
                {response.replace(/\{[^}]*"action"[^}]*\}/g, '').trim()}
              </Text>
            </GlassCard>
          ) : null}

          {/* Quick Actions */}
          <QuickActions />

          {/* Bottom padding for tab bar */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Floating Mic Button */}
        <View style={styles.micContainer}>
          <Animated.View
            style={[
              styles.micGlow,
              {
                transform: [{ scale: pulseAnim }],
                opacity: glowAnim,
                shadowColor: micColor,
              },
            ]}
          />
          <TouchableOpacity
            style={[
              styles.micButton,
              isActive && styles.micButtonActive,
              isProcessing && styles.micButtonProcessing,
            ]}
            onPress={handleMicPress}
            onLongPress={handleMicLongPress}
            disabled={isProcessing || isSpeaking}
            activeOpacity={0.8}
            accessibilityLabel={isActive ? 'Stop recording' : 'Start voice command'}
            accessibilityRole="button"
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={isActive ? 'stop' : isProcessing ? 'hourglass' : 'mic'}
                size={32}
                color={Colors.textPrimary}
              />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.micHint}>
            {isActive ? 'Long press to cancel' : 'Hold to cancel'}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subGreeting: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'center',
  },
  orbContainer: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: 0.5,
  },
  transcriptCard: {
    width: '100%',
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  responseCard: {
    width: '100%',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderColor: 'rgba(123,47,255,0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  cardLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  jarvisIcon: { fontSize: 14 },
  transcriptText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  responseText: {
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  intentBadge: {
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  intentText: {
    fontSize: Typography.xs,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  micContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    alignItems: 'center',
  },
  micGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    ...Shadows.glow,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
  micButtonActive: {
    backgroundColor: Colors.micActive,
    shadowColor: Colors.micActive,
  },
  micButtonProcessing: {
    backgroundColor: Colors.warning,
    shadowColor: Colors.warning,
  },
  micHint: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
