import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  leftIcon,
  rightIcon,
  secureTextEntry,
  multiline,
  editable = true,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ width: '100%' }}>
      {label && (
        <Text style={{
          fontSize: TOKENS.typography.sizes.sm,
          fontWeight: TOKENS.typography.weights.semibold,
          color: colors.text, marginBottom: 6,
        }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center',
        borderRadius: TOKENS.borderRadius.md,
        backgroundColor: colors.inputBg,
        paddingHorizontal: 16,
        height: multiline ? undefined : 48,
        paddingVertical: multiline ? 12 : undefined,
        borderWidth: focused ? 2 : error ? 1 : 0,
        borderColor: focused ? colors.primary : error ? colors.error : 'transparent',
        opacity: editable ? 1 : 0.6,
      }}>
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: TOKENS.typography.sizes.md,
            color: colors.text,
            minHeight: multiline ? 80 : undefined,
          }}
          {...rest}
        />
        {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.error, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}
