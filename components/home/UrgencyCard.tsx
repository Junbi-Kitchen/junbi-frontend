import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { FreshnessBar } from '../pantry/FreshnessBar';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { COPY } from '../../lib/copy';
import { getDaysUntilExpiry } from '../../lib/utils';
import type { PantryItem } from '../../types';

interface UrgencyCardProps {
  item: PantryItem;
  delay?: number;
  flex?: boolean;
}

export function UrgencyCard({ item, delay = 0, flex }: UrgencyCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const days = getDaysUntilExpiry(item.expiryDate ?? '');

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(400)} style={flex ? { flex: 1 } : undefined}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/(tabs)/kitchen');
        }}
        accessibilityLabel={`${item.name}, ${days <= 0 ? 'expires today' : `expires in ${days} days`}`}
        activeOpacity={0.85}
        style={{
          backgroundColor: colors.freshnessRedBg,
          borderRadius: TOKENS.borderRadius.card,
          padding: 18,
          ...TOKENS.shadows.sm,
        }}
      >
        <Text style={{
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.freshnessRed,
          fontFamily: TOKENS.typography.fontFamily.semibold,
        }}>
          {COPY.home.cardLabels.expiring}
        </Text>
        <Text style={{
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          marginTop: 10,
          marginBottom: 12,
          fontFamily: TOKENS.typography.fontFamily.bold,
        }} numberOfLines={1}>
          {item.name}
        </Text>
        <FreshnessBar expiryDate={item.expiryDate} />
        <Text style={{
          fontSize: 12,
          color: colors.freshnessRed,
          marginTop: 8,
          fontWeight: '500',
        }}>
          {days <= 0 ? 'Expires today' : `${days}d left`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
