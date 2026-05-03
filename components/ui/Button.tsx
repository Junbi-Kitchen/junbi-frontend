import React from 'react';
import { TouchableOpacity, ActivityIndicator, View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

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
  style?: object;
}

const SIZE_PADDING = { sm: { px: 16, py: 8 }, md: { px: 20, py: 12 }, lg: { px: 24, py: 16 } };
const TEXT_SIZE = { sm: TOKENS.typography.sizes.sm, md: TOKENS.typography.sizes.md, lg: TOKENS.typography.sizes.lg };

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
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const bgColor = {
    primary: colors.primary,
    secondary: colors.primaryMuted,
    ghost: 'transparent',
    danger: colors.error,
  }[variant];

  const textColor = {
    primary: '#fff',
    secondary: colors.primary,
    ghost: colors.text,
    danger: '#fff',
  }[variant];

  const { px, py } = SIZE_PADDING[size];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityRole="button"
      style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: TOKENS.borderRadius.md,
        backgroundColor: bgColor,
        paddingHorizontal: px, paddingVertical: py,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: colors.border,
        width: fullWidth ? '100%' : undefined,
        opacity: disabled || loading ? 0.5 : 1,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text style={{ fontSize: TEXT_SIZE[size], fontWeight: '600', color: textColor }}>
            {label}
          </Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
