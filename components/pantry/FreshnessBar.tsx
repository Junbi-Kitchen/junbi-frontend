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

function getBarColor(expiryDate?: string): string {
  if (!expiryDate) return TOKENS.colors.cardLabel;
  const days = getDaysUntilExpiry(expiryDate);
  if (days <= 2) return TOKENS.colors.freshnessRed;
  if (days <= 6) return TOKENS.colors.freshnessAmber;
  return TOKENS.colors.freshnessGreen;
}

interface FreshnessBarProps {
  expiryDate?: string;
}

export function FreshnessBar({ expiryDate }: FreshnessBarProps) {
  const color = getBarColor(expiryDate);
  const isUrgent = expiryDate ? getDaysUntilExpiry(expiryDate) <= 2 : false;

  const width = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    width.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
  }, [width]);

  useEffect(() => {
    if (isUrgent) {
      opacity.value = withRepeat(
        withTiming(0.45, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [isUrgent, opacity]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: `${color}25`,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          { height: 6, borderRadius: 3, backgroundColor: color },
          barStyle,
        ]}
      />
    </View>
  );
}
