/**
 * Login Screen — Futuristic glassmorphism design
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      // Error is shown via store
    }
  };

  return (
    <LinearGradient colors={Colors.gradientBg} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🤖</Text>
            <GlowText style={styles.logoText}>JARVIS</GlowText>
            <Text style={styles.tagline}>Personal AI Operating System</Text>
          </View>

          {/* Login Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.errorDismiss}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <NeonButton
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginBtn}
            />

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerHighlight}>Create one</Text>
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
  keyboardView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  logoText: {
    fontSize: Typography.hero,
    fontWeight: Typography.extrabold,
    color: Colors.primary,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 2,
  },
  card: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
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
  errorText: {
    color: Colors.error,
    fontSize: Typography.sm,
    flex: 1,
  },
  errorDismiss: {
    color: Colors.error,
    fontSize: Typography.base,
    paddingLeft: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  loginBtn: {
    marginTop: Spacing.md,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  registerHighlight: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
});
