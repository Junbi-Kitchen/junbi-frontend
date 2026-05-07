// Purpose: Slide-up toast notification with auto-dismiss and type-based styling

import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
}

const TYPE_TEXT_COLOR = {
  success: '#2D6A4F',
  error: '#E63946',
  info: '#3B82F6',
};

const TYPE_BORDER_COLOR = {
  success: '#2D6A4F',
  error: '#E63946',
  info: '#3B82F6',
};

export function ToastNotification({
  message,
  type,
  visible,
  onHide,
}: ToastNotificationProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      translateY.value = withDelay(3000, withTiming(100, { duration: 300 }));
      opacity.value = withDelay(
        3000,
        withTiming(0, { duration: 300 }, () => {
          runOnJS(onHide)();
        })
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 96,
          left: 16,
          right: 16,
          borderRadius: 12,
          borderLeftWidth: 4,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderLeftColor: TYPE_BORDER_COLOR[type],
          ...TOKENS.shadows.md,
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: TOKENS.typography.sizes.md, fontWeight: '500', color: TYPE_TEXT_COLOR[type] }}>
        {message}
      </Text>
    </Animated.View>
  );
}
