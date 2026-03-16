// Purpose: Numeric stepper control with haptic feedback and min/max clamping

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { TOKENS } from '../../lib/tokens';

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function StepperInput({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  unit,
}: StepperInputProps) {
  const handleDecrement = async () => {
    if (value <= min) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = async () => {
    if (value >= max) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.min(max, value + step));
  };

  return (
    <View className="flex-row items-center gap-3">
      <TouchableOpacity
        onPress={handleDecrement}
        disabled={value <= min}
        accessibilityLabel="Decrease quantity"
        className="w-9 h-9 rounded-full bg-[#F5F5F0] items-center justify-center"
        style={{ opacity: value <= min ? 0.4 : 1 }}
      >
        <Minus size={16} color={TOKENS.colors.text} />
      </TouchableOpacity>

      <View className="min-w-[48px] items-center">
        <Text className="text-base font-semibold text-[#1A1A1A]">
          {value}
          {unit && (
            <Text className="text-sm text-[#6B7280]"> {unit}</Text>
          )}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleIncrement}
        disabled={value >= max}
        accessibilityLabel="Increase quantity"
        className="w-9 h-9 rounded-full bg-[#2D6A4F] items-center justify-center"
        style={{ opacity: value >= max ? 0.4 : 1 }}
      >
        <Plus size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}
