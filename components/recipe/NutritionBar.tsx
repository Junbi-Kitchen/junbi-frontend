// Purpose: Horizontal segmented macro bar with calorie total and gram labels

import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import type { Nutrition } from '../../types';

interface NutritionBarProps {
  nutrition: Nutrition;
}

export function NutritionBar({ nutrition }: NutritionBarProps) {
  const { colors } = useTheme();
  const { calories, proteinG, carbsG, fatG } = nutrition;
  const total = proteinG + carbsG + fatG;

  const proteinPct = total > 0 ? (proteinG / total) * 100 : 0;
  const carbsPct = total > 0 ? (carbsG / total) * 100 : 0;
  const fatPct = total > 0 ? (fatG / total) * 100 : 0;

  return (
    <View>
      <Text
        style={{
          fontSize: TOKENS.typography.sizes['2xl'],
          fontWeight: TOKENS.typography.weights.bold,
          color: colors.text,
          marginBottom: 8,
        }}
      >
        {calories}{' '}
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.regular,
            color: colors.textSecondary,
          }}
        >
          calories
        </Text>
      </Text>

      {/* Segmented bar */}
      <View
        style={{
          flexDirection: 'row',
          height: 10,
          borderRadius: 5,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        <View style={{ flex: proteinPct, backgroundColor: colors.primary }} />
        <View style={{ flex: carbsPct, backgroundColor: colors.accent, marginHorizontal: 2 }} />
        <View style={{ flex: fatPct, backgroundColor: colors.textMuted }} />
      </View>

      {/* Labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <MacroLabel label="Protein" grams={proteinG} color={colors.primary} />
        <MacroLabel label="Carbs" grams={carbsG} color={colors.accent} />
        <MacroLabel label="Fat" grams={fatG} color={colors.textMuted} />
      </View>
    </View>
  );
}

function MacroLabel({
  label,
  grams,
  color,
}: {
  label: string;
  grams: number;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.lg,
          fontWeight: TOKENS.typography.weights.semibold,
          color,
        }}
      >
        {grams}g
      </Text>
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.xs,
          color: colors.textSecondary,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
