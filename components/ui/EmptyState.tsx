import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: colors.primaryMuted,
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
      }}>
        <Icon size={36} color={colors.primary} />
      </View>
      <Text style={{
        fontSize: TOKENS.typography.sizes['2xl'],
        fontWeight: TOKENS.typography.weights.bold,
        color: colors.text,
        textAlign: 'center', marginBottom: 8,
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: TOKENS.typography.sizes.md,
        color: colors.textSecondary,
        textAlign: 'center', lineHeight: 24, marginBottom: 32,
      }}>
        {subtitle}
      </Text>
      {ctaLabel && onCta && <Button label={ctaLabel} onPress={onCta} variant="primary" size="md" />}
    </View>
  );
}
