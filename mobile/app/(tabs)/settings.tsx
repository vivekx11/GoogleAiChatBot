/**
 * Settings Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GlowText } from '../../components/ui/GlowText';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeonButton } from '../../components/ui/NeonButton';

export default function SettingsScreen() {
  const { user, settings, updateProfile, logout } = useAuthStore();
  const [autoRead, setAutoRead] = useState(Boolean(settings?.auto_read_response ?? true));
  const [notifications, setNotifications] = useState(Boolean(settings?.notifications ?? true));
  const [offlineMode, setOfflineMode] = useState(Boolean(settings?.offline_mode ?? false));
  const [language, setLanguage] = useState<'en' | 'hi'>(user?.language || 'en');
  const [voiceSpeed, setVoiceSpeed] = useState(settings?.voice_speed ?? 1.0);
  const [wakeWord, setWakeWord] = useState(settings?.wake_word || 'hey jarvis');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        language,
        settings: {
          auto_read_response: autoRead ? 1 : 0,
          notifications: notifications ? 1 : 0,
          offline_mode: offlineMode ? 1 : 0,
          voice_speed: voiceSpeed,
          wake_word: wakeWord,
        },
      });
      Alert.alert('Saved', 'Settings updated successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Auth disabled — stay in tabs
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    label,
    value,
    onToggle,
    description,
  }: {
    icon: string;
    label: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    description?: string;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {description && <Text style={styles.settingDesc}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.bgInput, true: 'rgba(0,212,255,0.3)' }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );

  return (
    <LinearGradient colors={Colors.gradientBg} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <GlowText style={styles.title}>Settings</GlowText>
          </View>

          {/* Profile Card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </GlassCard>

          {/* Language */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>🌍 Language</Text>
            <View style={styles.langRow}>
              {(['en', 'hi'] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langBtn, language === lang && styles.langBtnActive]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[styles.langText, language === lang && styles.langTextActive]}>
                    {lang === 'en' ? '🇺🇸 English' : '🇮🇳 Hindi'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Voice Settings */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>🎙️ Voice</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Wake Word</Text>
              <TextInput
                style={styles.fieldInput}
                value={wakeWord}
                onChangeText={setWakeWord}
                placeholder="hey jarvis"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Voice Speed: {voiceSpeed.toFixed(1)}x
              </Text>
              <View style={styles.speedRow}>
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[styles.speedBtn, voiceSpeed === speed && styles.speedBtnActive]}
                    onPress={() => setVoiceSpeed(speed)}
                  >
                    <Text style={[styles.speedText, voiceSpeed === speed && styles.speedTextActive]}>
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <SettingRow
              icon="🔊"
              label="Auto-read Responses"
              description="Jarvis speaks AI responses aloud"
              value={autoRead}
              onToggle={setAutoRead}
            />
          </GlassCard>

          {/* App Settings */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ App</Text>
            <SettingRow
              icon="🔔"
              label="Notifications"
              value={notifications}
              onToggle={setNotifications}
            />
            <SettingRow
              icon="📡"
              label="Offline Mode"
              description="Basic commands without internet"
              value={offlineMode}
              onToggle={setOfflineMode}
            />
          </GlassCard>

          {/* About */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ About</Text>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>AI Model</Text>
              <Text style={styles.aboutValue}>GPT-4o</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Voice Engine</Text>
              <Text style={styles.aboutValue}>Whisper + Expo Speech</Text>
            </View>
          </GlassCard>

          {/* Actions */}
          <NeonButton
            title={isSaving ? 'Saving...' : 'Save Settings'}
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveBtn}
          />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,212,255,0.2)',
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary },
  profileEmail: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  section: { padding: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.md },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  settingIcon: { fontSize: 18 },
  settingLabel: { fontSize: Typography.base, color: Colors.textPrimary },
  settingDesc: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  langRow: { flexDirection: 'row', gap: Spacing.sm },
  langBtn: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
  },
  langBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(0,212,255,0.1)' },
  langText: { color: Colors.textSecondary, fontSize: Typography.sm },
  langTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  fieldInput: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  speedRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs },
  speedBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: Colors.bgInput,
  },
  speedBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(0,212,255,0.1)' },
  speedText: { fontSize: Typography.xs, color: Colors.textSecondary },
  speedTextActive: { color: Colors.primary },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  aboutLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  aboutValue: { fontSize: Typography.sm, color: Colors.textPrimary },
  saveBtn: { marginBottom: Spacing.md },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
    backgroundColor: 'rgba(255,68,68,0.05)',
  },
  logoutText: { fontSize: Typography.base, color: Colors.error, fontWeight: Typography.medium },
});
