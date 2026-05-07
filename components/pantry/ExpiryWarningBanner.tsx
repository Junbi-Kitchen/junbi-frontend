// Purpose: Collapsible amber banner warning about expiring pantry items

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { pluralize } from '../../lib/utils';

interface ExpiryWarningBannerProps {
  count: number;
  onPress?: () => void;
}

export function ExpiryWarningBanner({ count, onPress }: ExpiryWarningBannerProps) {
  const { colors } = useTheme();
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (count > 0) {
      height.value = withTiming(52, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      height.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  if (count === 0) return null;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={`${count} items expiring soon. Tap to view.`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.warningLight,
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 10,
        }}
      >
        <AlertTriangle size={18} color={colors.warning} />
        <Text
          style={{
            flex: 1,
            fontSize: TOKENS.typography.sizes.sm,
            fontWeight: TOKENS.typography.weights.medium,
            color: colors.warning,
          }}
        >
          {pluralize(count, 'item')} expiring soon — use them first
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
