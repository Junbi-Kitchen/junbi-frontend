// Purpose: Single ingredient row showing pantry availability status

import React from 'react';
import { View, Text } from 'react-native';
import { CheckCircle, Circle } from 'lucide-react-native';
import { TOKENS } from '../../lib/tokens';
import type { Ingredient } from '../../types';

interface RecipeIngredientRowProps {
  ingredient: Ingredient;
  inPantry: boolean;
}

export function RecipeIngredientRow({
  ingredient,
  inPantry,
}: RecipeIngredientRowProps) {
  return (
    <View
      className="flex-row items-center px-4 py-3 rounded-xl mb-2"
      style={{
        backgroundColor: inPantry
          ? TOKENS.colors.primaryMuted
          : TOKENS.colors.inputBg,
      }}
    >
      <View className="mr-3">
        {inPantry ? (
          <CheckCircle size={18} color={TOKENS.colors.primary} />
        ) : (
          <Circle size={18} color={TOKENS.colors.textMuted} />
        )}
      </View>
      <Text
        className="flex-1 text-base"
        style={{ color: inPantry ? TOKENS.colors.primary : TOKENS.colors.text }}
      >
        {ingredient.name}
      </Text>
      <Text className="text-sm text-[#6B7280]">
        {ingredient.quantity} {ingredient.unit}
      </Text>
    </View>
  );
}
