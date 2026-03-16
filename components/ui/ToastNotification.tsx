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
import { cn } from '../../lib/utils';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
}

const TYPE_STYLES = {
  success: {
    border: 'border-l-[#2D6A4F]',
    text: 'text-[#2D6A4F]',
    bg: 'bg-white',
  },
  error: {
    border: 'border-l-[#E63946]',
    text: 'text-[#E63946]',
    bg: 'bg-white',
  },
  info: {
    border: 'border-l-[#3B82F6]',
    text: 'text-[#3B82F6]',
    bg: 'bg-white',
  },
};

export function ToastNotification({
  message,
  type,
  visible,
  onHide,
}: ToastNotificationProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto-dismiss after 3s
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

  const styles = TYPE_STYLES[type];

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        'absolute bottom-24 left-4 right-4 rounded-xl shadow-md',
        'border-l-4 px-4 py-3',
        styles.bg,
        styles.border
      )}
    >
      <Text className={cn('text-base font-medium', styles.text)}>
        {message}
      </Text>
    </Animated.View>
  );
}
