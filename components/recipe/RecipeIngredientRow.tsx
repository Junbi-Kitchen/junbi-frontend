// Purpose: Single ingredient row showing pantry availability status

import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import type { Ingredient } from '../../types';

interface RecipeIngredientRowProps {
  ingredient: Ingredient;
  inPantry: boolean;
  scaledQuantity?: number;
}

function formatQty(qty: number): string {
  const rounded = Math.round(qty * 10) / 10;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded);
}

export function RecipeIngredientRow({
  ingredient,
  inPantry,
  scaledQuantity,
}: RecipeIngredientRowProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: inPantry ? colors.primaryMuted : colors.inputBg,
      }}
    >
      <View style={{ marginRight: 12 }}>
        {inPantry ? (
          <CheckCircle size={18} color={colors.primary} />
        ) : (
          <Circle size={18} color={colors.textMuted} />
        )}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: TOKENS.typography.sizes.md,
          color: inPantry ? colors.primary : colors.text,
        }}
      >
        {ingredient.name}
      </Text>
      <Text style={{ fontSize: TOKENS.typography.sizes.sm, color: colors.textSecondary }}>
        {scaledQuantity !== undefined ? formatQty(scaledQuantity) : ingredient.quantity} {ingredient.unit}
      </Text>
    </View>
  );
}
