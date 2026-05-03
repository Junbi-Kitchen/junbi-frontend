// Purpose: Auto-dismissing toast that appears when user saves food from waste

import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

interface SavedToastProps {
  amount: number;
  visible: boolean;
  onDismiss: () => void;
}

export function SavedToast({ amount, visible, onDismiss }: SavedToastProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSequence(
        withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
        withDelay(
          1800,
          withTiming(-100, { duration: 300, easing: Easing.in(Easing.ease) })
        )
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1800, withTiming(0, { duration: 300 }, () => {
          runOnJS(onDismiss)();
        }))
      );
    }
  }, [visible, translateY, opacity, onDismiss]);

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
          top: 60,
          left: 20,
          right: 20,
          zIndex: 100,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: colors.success,
          shadowColor: colors.success,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        },
        animatedStyle,
      ]}
    >
      <Sparkles size={20} color={'#fff'} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
          +${amount.toFixed(2)} saved!
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
          Nice — you used it before it expired
        </Text>
      </View>
    </Animated.View>
  );
}
