import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { getTagColor, getTagTextColor } from '../../lib/utils';
import type { DietaryTag } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'dietary' | 'info' | 'warning' | 'success';
  size?: 'sm' | 'md';
  tag?: DietaryTag;
}

const SIZE_PADDING = {
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  md: { paddingHorizontal: 12, paddingVertical: 4 },
};

const SIZE_TEXT = {
  sm: TOKENS.typography.sizes.xs,
  md: TOKENS.typography.sizes.sm,
};

export function Badge({ label, variant = 'info', size = 'sm', tag }: BadgeProps) {
  const { colors } = useTheme();

  const VARIANT_BG = {
    dietary: 'transparent',
    info: colors.primaryMuted,
    warning: colors.warningLight,
    success: colors.successLight,
  };

  const VARIANT_TEXT_COLOR = {
    dietary: colors.text,
    info: colors.primary,
    warning: colors.warning,
    success: colors.success,
  };

  const bgColor = variant === 'dietary' && tag ? undefined : VARIANT_BG[variant];
  const textColor = variant === 'dietary' && tag ? undefined : VARIANT_TEXT_COLOR[variant];

  if (variant === 'dietary' && tag) {
    return (
      <View
        className={`rounded-full flex-row items-center ${getTagColor(tag)}`}
        style={SIZE_PADDING[size]}
      >
        <Text className={`font-semibold ${getTagTextColor(tag)}`} style={{ fontSize: SIZE_TEXT[size] }}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: bgColor,
        ...SIZE_PADDING[size],
      }}
    >
      <Text style={{ fontWeight: '600', color: textColor, fontSize: SIZE_TEXT[size] }}>
        {label}
      </Text>
    </View>
  );
}
