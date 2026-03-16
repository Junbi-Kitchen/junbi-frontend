// Purpose: Individual recipe step card with optional timer chip and active state

import React from 'react';
import { View, Text } from 'react-native';
import { Timer } from 'lucide-react-native';
import { TOKENS } from '../../lib/tokens';
import type { RecipeStep } from '../../types';

interface RecipeStepCardProps {
  step: RecipeStep;
  isActive?: boolean;
}

export function RecipeStepCard({ step, isActive = false }: RecipeStepCardProps) {
  return (
    <View
      className="flex-row mb-4 rounded-xl overflow-hidden"
      style={{
        backgroundColor: TOKENS.colors.white,
        ...TOKENS.shadows.sm,
        borderLeftWidth: 3,
        borderLeftColor: isActive ? TOKENS.colors.primary : 'transparent',
      }}
    >
      {/* Step number */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center m-4"
        style={{
          backgroundColor: isActive
            ? TOKENS.colors.primary
            : TOKENS.colors.inputBg,
        }}
      >
        <Text
          className="text-sm font-bold"
          style={{
            color: isActive ? TOKENS.colors.white : TOKENS.colors.textSecondary,
          }}
        >
          {step.stepNumber}
        </Text>
      </View>

      <View className="flex-1 py-4 pr-4">
        <Text className="text-base text-[#1A1A1A] leading-6">
          {step.instruction}
        </Text>
        {step.timerMinutes && (
          <View
            className="flex-row items-center mt-2 gap-1 rounded-full self-start px-3 py-1"
            style={{ backgroundColor: TOKENS.colors.accentLight }}
          >
            <Timer size={12} color={TOKENS.colors.accent} />
            <Text className="text-xs font-semibold text-[#F4A261]">
              {step.timerMinutes} min
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
