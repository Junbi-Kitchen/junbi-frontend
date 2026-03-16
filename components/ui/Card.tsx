// Purpose: Base card primitive with optional press animation and padding variants

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Card({ children, onPress, style, padding = 'md' }: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const baseClass = cn(
    'bg-white rounded-2xl shadow-sm',
    PADDING[padding]
  );

  if (onPress) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        style={[animatedStyle, style]}
        className={baseClass}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <View className={baseClass} style={style}>
      {children}
    </View>
  );
}
