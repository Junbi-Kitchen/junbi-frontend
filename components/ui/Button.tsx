// Purpose: Primary button primitive with variants, sizes, loading state, and haptic feedback

import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../lib/utils';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const BASE = 'flex-row items-center justify-center rounded-xl';

const VARIANTS = {
  primary: 'bg-[#2D6A4F] active:opacity-80',
  secondary: 'bg-[#D8F3DC] active:opacity-80',
  ghost: 'bg-transparent border border-[#E8E8E3] active:opacity-70',
  danger: 'bg-[#E63946] active:opacity-80',
};

const TEXT_VARIANTS = {
  primary: 'text-white font-semibold',
  secondary: 'text-[#2D6A4F] font-semibold',
  ghost: 'text-[#1A1A1A] font-medium',
  danger: 'text-white font-semibold',
};

const SIZES = {
  sm: 'px-4 py-2',
  md: 'px-5 py-3',
  lg: 'px-6 py-4',
};

const TEXT_SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
}: ButtonProps) {
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityRole="button"
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50'
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#2D6A4F'}
        />
      ) : (
        <>
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={cn(TEXT_VARIANTS[variant], TEXT_SIZES[size])}>
            {label}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
