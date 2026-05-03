/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GlowText } from '../../components/ui/GlowText';
import { NeonButton } from '../../components/ui/NeonButton';
import { GlassCard } from '../../components/ui/GlassCard';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await register(name.trim(), email.trim(), password, language);
      router.replace('/(tabs)');
    } catch (_) {}
  };

  return (
    <LinearGradient colors={Colors.gradientBg} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <GlowText style={styles.title}>Create Account</GlowText>
            <Text style={styles.subtitle}>Join Jarvis AI</Text>
          </View>

          <GlassCard style={styles.card}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.errorDismiss}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {[
              { label: 'Full Name', value: name, setter: setName, placeholder: 'Tony Stark', type: 'default' },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'tony@stark.com', type: 'email-address' },
              { label: 'Password', value: password, setter: setPassword, placeholder: '••••••••', type: 'default', secure: true },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.setter as any}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={field.type as any}
                  autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                  secureTextEntry={field.secure}
                />
              </View>
            ))}

            {/* Language Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Language</Text>
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
            </View>

            <NeonButton
              title={isLoading ? 'Creating account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isLoading}
              style={styles.btn}
            />

            <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginHighlight}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.lg, paddingTop: Spacing.xxl },
  header: { marginBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: Typography.base },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.primary },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.xs },
  card: { padding: Spacing.xl },
  errorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,68,68,0.15)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: Typography.sm, flex: 1 },
  errorDismiss: { color: Colors.error, fontSize: Typography.base, paddingLeft: Spacing.sm },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, letterSpacing: 1 },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
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
  langBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0,212,255,0.1)',
  },
  langText: { color: Colors.textSecondary, fontSize: Typography.sm },
  langTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  btn: { marginTop: Spacing.md },
  loginLink: { alignItems: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textSecondary, fontSize: Typography.sm },
  loginHighlight: { color: Colors.primary, fontWeight: Typography.semibold },
});
