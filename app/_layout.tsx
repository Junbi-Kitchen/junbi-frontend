// Purpose: Root layout wrapping the entire app with gesture, sheet, query, safe area, and auth providers

import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useUserStore } from '../stores/userStore';
import { usePantryStore } from '../stores/pantryStore';
import { useRecipeStore } from '../stores/recipeStore';
import { useGroceryStore } from '../stores/groceryStore';
import { useSavingsStore } from '../stores/savingsStore';
import { useOrderStore } from '../stores/orderStore';
import { TOKENS } from '../lib/tokens';
import { storage, STORAGE_KEYS } from '../lib/storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { user, setUser, fetchProfile, hasSeenOnboarding, setHasSeenOnboarding } = useUserStore();
  const fetchPantry = usePantryStore((s) => s.fetchItems);
  const { fetchSaved, fetchCollections } = useRecipeStore();
  const fetchGrocery = useGroceryStore((s) => s.fetchItems);
  const fetchSavings = useSavingsStore((s) => s.fetchSummary);
  const { fetchActiveOrder, fetchStores } = useOrderStore();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const seen = await storage.getBoolean(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
      console.log('[Auth] onAuthStateChanged fired — firebaseUser:', !!firebaseUser, '| hasSeenOnboarding from storage:', seen);
      if (seen) setHasSeenOnboarding(true);
      if (firebaseUser) {
        try {
          await fetchProfile();
          console.log('[Auth] fetchProfile complete');
          // Fire-and-forget parallel data loads after auth succeeds
          Promise.all([
            fetchPantry(),
            fetchSaved(),
            fetchCollections(),
            fetchGrocery(),
            fetchSavings(),
            fetchActiveOrder(),
            fetchStores(),
          ]).catch(() => {/* non-fatal */});
        } catch {
          // Backend unreachable — keep null user so guard redirects to onboarding
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onQuizScreen = segments[0] === '(auth)' && segments[1] === 'quiz';
    console.log('[Guard] user:', !!user, '| hasSeenOnboarding:', hasSeenOnboarding, '| segments:', segments);

    if (!user && !inAuthGroup) {
      console.log('[Guard] → redirecting to', hasSeenOnboarding ? 'signin' : 'onboarding');
      router.replace(hasSeenOnboarding ? '/(auth)/signin' : '/(auth)/onboarding');
    } else if (user && inAuthGroup && !onQuizScreen) {
      console.log('[Guard] → redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [user, authLoading, hasSeenOnboarding, segments]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: TOKENS.colors.background }}>
        <ActivityIndicator size="large" color={TOKENS.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: TOKENS.colors.background },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(auth)/onboarding" />
                <Stack.Screen name="(auth)/quiz" />
                <Stack.Screen name="(auth)/signin" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="recipe/[id]" />
                <Stack.Screen name="import" />
                <Stack.Screen name="connected-accounts" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="savings" />
              </Stack>
              <StatusBar style="dark" />
          </AuthGuard>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
