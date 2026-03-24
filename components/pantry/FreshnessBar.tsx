// Purpose: Thin horizontal bar showing freshness status based on expiry days

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { getDaysUntilExpiry } from '../../lib/utils';
import { TOKENS } from '../../lib/tokens';

const COLORS = {
  fresh: TOKENS.colors.success,
  warning: TOKENS.colors.warning,
  urgent: TOKENS.colors.error,
  staple: TOKENS.colors.textSecondary,
};

function getBarColor(expiryDate?: string): string {
  if (!expiryDate) return COLORS.staple;
  const days = getDaysUntilExpiry(expiryDate);
  if (days <= 2) return COLORS.urgent;
  if (days <= 6) return COLORS.warning;
  return COLORS.fresh;
}

interface FreshnessBarProps {
  expiryDate?: string;
}

export function FreshnessBar({ expiryDate }: FreshnessBarProps) {
  const color = getBarColor(expiryDate);
  const isUrgent = expiryDate ? getDaysUntilExpiry(expiryDate) <= 2 : false;
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (isUrgent) {
      pulseOpacity.value = withRepeat(
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isUrgent, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View
      style={{
        height: 4,
        borderRadius: 2,
        backgroundColor: `${color}30`,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          {
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
            width: '100%',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
