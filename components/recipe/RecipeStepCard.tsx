// Purpose: Individual recipe step card with optional timer chip and active state

import React from 'react';
import { View, Text } from 'react-native';
import { Timer } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import type { RecipeStep } from '../../types';

interface RecipeStepCardProps {
  step: RecipeStep;
  isActive?: boolean;
}

export function RecipeStepCard({ step, isActive = false }: RecipeStepCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: isActive ? colors.primary : 'transparent',
        ...TOKENS.shadows.sm,
      }}
    >
      {/* Step number */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          margin: 16,
          backgroundColor: isActive ? colors.primary : colors.inputBg,
        }}
      >
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.sm,
            fontWeight: '700',
            color: isActive ? '#fff' : colors.textSecondary,
          }}
        >
          {step.stepNumber}
        </Text>
      </View>

      <View style={{ flex: 1, paddingVertical: 16, paddingRight: 16 }}>
        <Text style={{ fontSize: TOKENS.typography.sizes.md, color: colors.text, lineHeight: 24 }}>
          {step.instruction}
        </Text>
        {step.timerMinutes && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              gap: 4,
              borderRadius: 999,
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: colors.accentLight,
            }}
          >
            <Timer size={12} color={colors.accent} />
            <Text style={{ fontSize: TOKENS.typography.sizes.xs, fontWeight: '600', color: colors.accent }}>
              {step.timerMinutes} min
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
