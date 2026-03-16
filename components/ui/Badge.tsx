// Purpose: Pill badge for dietary tags, status info, warnings, and success states

import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';
import { getTagColor, getTagTextColor } from '../../lib/utils';
import type { DietaryTag } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'dietary' | 'info' | 'warning' | 'success';
  size?: 'sm' | 'md';
  tag?: DietaryTag;
}

const VARIANT_BG = {
  dietary: '',
  info: 'bg-blue-100',
  warning: 'bg-[#FEF3C7]',
  success: 'bg-[#D8F3DC]',
};

const VARIANT_TEXT = {
  dietary: '',
  info: 'text-blue-700',
  warning: 'text-[#F59E0B]',
  success: 'text-[#2D6A4F]',
};

const SIZE_PADDING = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
};

const SIZE_TEXT = {
  sm: 'text-xs',
  md: 'text-sm',
};

export function Badge({ label, variant = 'info', size = 'sm', tag }: BadgeProps) {
  const bgClass =
    variant === 'dietary' && tag
      ? getTagColor(tag)
      : VARIANT_BG[variant];

  const textClass =
    variant === 'dietary' && tag
      ? getTagTextColor(tag)
      : VARIANT_TEXT[variant];

  return (
    <View
      className={cn(
        'rounded-full flex-row items-center',
        bgClass,
        SIZE_PADDING[size]
      )}
    >
      <Text className={cn('font-semibold', textClass, SIZE_TEXT[size])}>
        {label}
      </Text>
    </View>
  );
}
