import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function StepperInput({ value, onChange, min = 0, max = 99, step = 1, unit }: StepperInputProps) {
  const { colors } = useTheme();

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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity
        onPress={handleDecrement}
        disabled={value <= min}
        accessibilityLabel="Decrease quantity"
        style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: colors.inputBg,
          alignItems: 'center', justifyContent: 'center',
          opacity: value <= min ? 0.4 : 1,
        }}
      >
        <Minus size={16} color={colors.text} />
      </TouchableOpacity>

      <View style={{ minWidth: 48, alignItems: 'center' }}>
        <Text style={{ fontSize: TOKENS.typography.sizes.md, fontWeight: '600', color: colors.text }}>
          {value}
          {unit && (
            <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary }}> {unit}</Text>
          )}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleIncrement}
        disabled={value >= max}
        accessibilityLabel="Increase quantity"
        style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: colors.primary,
          alignItems: 'center', justifyContent: 'center',
          opacity: value >= max ? 0.4 : 1,
        }}
      >
        <Plus size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
