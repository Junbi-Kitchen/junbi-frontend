// Purpose: Animated count-up savings display with trend arrow

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { TOKENS } from '../../lib/tokens';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface SavingsCounterProps {
  amount: number;
  lastMonthAmount?: number;
  size?: 'sm' | 'lg';
}

export function SavingsCounter({
  amount,
  lastMonthAmount,
  size = 'lg',
}: SavingsCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(amount, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [amount, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `$${animatedValue.value.toFixed(2)}`,
    } as Record<string, string>;
  });

  const isUp = lastMonthAmount !== undefined ? amount >= lastMonthAmount : true;
  const diff = lastMonthAmount !== undefined ? Math.abs(amount - lastMonthAmount) : 0;

  const fontSize = size === 'lg' ? 44 : 28;

  return (
    <View>
      <AnimatedText
        animatedProps={animatedProps}
        style={{
          fontSize,
          fontWeight: '700',
          color: TOKENS.colors.accent,
          fontVariant: ['tabular-nums'],
        }}
      >
        ${amount.toFixed(2)}
      </AnimatedText>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.sm,
            color: TOKENS.colors.textSecondary,
          }}
        >
          saved this month
        </Text>
        {lastMonthAmount !== undefined && diff > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            {isUp ? (
              <TrendingUp size={14} color={TOKENS.colors.success} />
            ) : (
              <TrendingDown size={14} color={TOKENS.colors.error} />
            )}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isUp ? TOKENS.colors.success : TOKENS.colors.error,
              }}
            >
              ${diff.toFixed(0)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
