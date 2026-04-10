// Purpose: Styled text input with label, error, and icon slot support

import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { cn } from '../../lib/utils';

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
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-semibold text-[#1A1A1A] mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'flex-row items-center rounded-xl bg-[#F5F5F0] px-4',
          multiline ? 'py-3 items-start' : 'h-12',
          error && 'border border-[#E63946]',
          !editable && 'opacity-60'
        )}
        style={focused ? { borderWidth: 2, borderColor: '#2D6A4F' } : undefined}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'flex-1 text-[#1A1A1A] text-base',
            multiline && 'min-h-[80px] text-top'
          )}
          {...rest}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-sm text-[#E63946] mt-1">{error}</Text>
      )}
    </View>
  );
}
