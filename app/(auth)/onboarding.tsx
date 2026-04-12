// Purpose: Starting screen — first thing a new user sees. Navigates to quiz or signin.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UtensilsCrossed } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { TOKENS } from '../../lib/tokens';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: TOKENS.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <UtensilsCrossed size={48} color={TOKENS.colors.primary} />
        </View>

        <Text
          style={{
            fontSize: TOKENS.typography.sizes['3xl'],
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Welcome to Gook
        </Text>

        <Text
          style={{
            fontSize: TOKENS.typography.sizes.lg,
            color: TOKENS.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 28,
            marginBottom: 48,
          }}
        >
          Import recipes, track your pantry, and get AI-powered meal suggestions delivered to your door.
        </Text>

        <Button
          label="Get started"
          onPress={() => router.push('/(auth)/quiz')}
          variant="primary"
          size="lg"
          fullWidth
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signin')}
          accessibilityLabel="Sign in to existing account"
          style={{ marginTop: 20, paddingVertical: 8 }}
        >
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.md,
              color: TOKENS.colors.primary,
              fontWeight: TOKENS.typography.weights.medium,
            }}
          >
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
