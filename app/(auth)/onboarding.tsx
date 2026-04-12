// Purpose: Welcome screen for first-time users. Leads to quiz then signin.

import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { UtensilsCrossed } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { TOKENS } from '../../lib/tokens';
import { APP } from '../../lib/constants';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' }}>
        {/* Icon */}
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

        {/* Headline */}
        <Text
          style={{
            fontSize: TOKENS.typography.sizes['3xl'],
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Welcome to {APP.name}
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

        {/* CTAs */}
        <View style={{ width: '100%', gap: 12 }}>
          <Button
            label="Get started"
            onPress={() => router.push('/(auth)/quiz')}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            label="I already have an account"
            onPress={() => router.push('/(auth)/signin')}
            variant="ghost"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
