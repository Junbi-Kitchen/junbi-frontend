// Purpose: Root layout wrapping the entire app with gesture, sheet, query, and safe area providers

import '../global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { TOKENS } from '../lib/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: TOKENS.colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(auth)/onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="recipe/[id]" />
              <Stack.Screen name="import" />
              <Stack.Screen name="connected-accounts" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="savings" />
            </Stack>
            <StatusBar style="dark" />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
