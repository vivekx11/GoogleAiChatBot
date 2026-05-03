/**
 * Root index — redirect based on auth state
 */

import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
