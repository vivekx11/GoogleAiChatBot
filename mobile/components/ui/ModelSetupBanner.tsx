/**
 * ModelSetupBanner
 *
 * Shows a download prompt when RunAnywhere models aren't loaded yet.
 * Displayed inline at the top of Voice and Chat screens.
 */
//-----------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useModelService } from '../../services/modelService';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface ModelSetupBannerProps {
  /** Which models this screen needs */
  requires: ('llm' | 'stt' | 'tts')[];
}

export function ModelSetupBanner({ requires }: ModelSetupBannerProps) {
  const {
    sdkReady,
    isLLMLoaded, isSTTLoaded, isTTSLoaded,
    isLLMDownloading, isSTTDownloading, isTTSDownloading,
    llmProgress, sttProgress, ttsProgress,
    setupLLM, setupSTT, setupTTS, setupAll,
    error, clearError,
  } = useModelService();

  const needsLLM = requires.includes('llm') && !isLLMLoaded;
  const needsSTT = requires.includes('stt') && !isSTTLoaded;
  const needsTTS = requires.includes('tts') && !isTTSLoaded;
  const allReady = !needsLLM && !needsSTT && !needsTTS;

  if (!sdkReady || allReady) return null;

  const isAnyDownloading = isLLMDownloading || isSTTDownloading || isTTSDownloading;

  const handleSetup = async () => {
    if (requires.length === 3) {
      await setupAll();
    } else {
      if (needsLLM) await setupLLM();
      if (needsSTT) await setupSTT();
      if (needsTTS) await setupTTS();
    }
  };

  const modelRows: { label: string; progress: number; downloading: boolean; loaded: boolean }[] = [
    ...(needsLLM ? [{ label: 'LLM (LFM2 350M)', progress: llmProgress, downloading: isLLMDownloading, loaded: isLLMLoaded }] : []),
    ...(needsSTT ? [{ label: 'STT (Whisper Tiny)', progress: sttProgress, downloading: isSTTDownloading, loaded: isSTTLoaded }] : []),
    ...(needsTTS ? [{ label: 'TTS (Piper)', progress: ttsProgress, downloading: isTTSDownloading, loaded: isTTSLoaded }] : []),
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,212,255,0.12)', 'rgba(123,47,255,0.08)']}
        style={styles.banner}
      >
        <View style={styles.header}>
          <Ionicons name="download-outline" size={20} color={Colors.primary} />
          <Text style={styles.title}>AI Models Required</Text>
        </View>

        <Text style={styles.subtitle}>
          Download once (~540 MB total). All AI runs on-device — no internet needed after.
        </Text>

        {error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Per-model progress */}
        {modelRows.map((m) => (
          <View key={m.label} style={styles.modelRow}>
            <View style={styles.modelInfo}>
              <Text style={styles.modelLabel}>{m.label}</Text>
              {m.loaded && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              )}
            </View>
            {m.downloading && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${m.progress}%` }]} />
                <Text style={styles.progressText}>{m.progress}%</Text>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.btn, isAnyDownloading && styles.btnDisabled]}
          onPress={handleSetup}
          disabled={isAnyDownloading}
        >
          {isAnyDownloading ? (
            <ActivityIndicator size="small" color={Colors.bg} />
          ) : (
            <Text style={styles.btnText}>Download & Load Models</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  banner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  title: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 },
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  errorText: { color: Colors.error, fontSize: Typography.xs, flex: 1 },
  modelRow: { marginBottom: Spacing.sm },
  modelInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  modelLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  progressBar: {
    height: 6,
    backgroundColor: Colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    position: 'absolute',
    right: 4,
    top: -10,
    fontSize: 9,
    color: Colors.textMuted,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.bg, fontSize: Typography.sm, fontWeight: Typography.semibold },
});
