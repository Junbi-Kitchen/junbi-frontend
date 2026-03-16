// Purpose: Centered empty state with icon, title, subtitle, and optional CTA

import React from 'react';
import { View, Text } from 'react-native';
import { TOKENS } from '../../lib/tokens';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 rounded-full bg-[#D8F3DC] items-center justify-center mb-6">
        <Icon size={36} color={TOKENS.colors.primary} />
      </View>
      <Text className="text-2xl font-bold text-[#1A1A1A] text-center mb-2">
        {title}
      </Text>
      <Text className="text-base text-[#6B7280] text-center leading-6 mb-8">
        {subtitle}
      </Text>
      {ctaLabel && onCta && (
        <Button label={ctaLabel} onPress={onCta} variant="primary" size="md" />
      )}
    </View>
  );
}
