/**
 * Root Layout — Expo Router
 *
 * Initializes RunAnywhere SDK and wraps the app with ModelServiceProvider.
 * Models are downloaded/loaded lazily per screen (not all at startup).
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ModelServiceProvider } from '../services/modelService';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function init() {
      await SplashScreen.hideAsync();
    }
    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* ModelServiceProvider initializes RunAnywhere SDK and manages model state */}
        <ModelServiceProvider>
          <StatusBar style="light" backgroundColor="#050510" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </ModelServiceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
