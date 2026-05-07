import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING_MAP = { none: 0, sm: 12, md: 16, lg: 24 };

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({ children, onPress, style, padding = 'md' }: CardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };
  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: TOKENS.borderRadius.xl,
    padding: PADDING_MAP[padding],
    ...TOKENS.shadows.sm,
  };

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        style={[cardStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
}
