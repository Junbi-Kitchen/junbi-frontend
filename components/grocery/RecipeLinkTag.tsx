// Purpose: Small amber pill linking a grocery item back to its source recipe

import React from 'react';
import { View, Text } from 'react-native';
import { UtensilsCrossed } from 'lucide-react-native';
import { truncate } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';

interface RecipeLinkTagProps {
  recipeTitle: string;
}

export function RecipeLinkTag({ recipeTitle }: RecipeLinkTagProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accentLight,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 4,
        alignSelf: 'flex-start',
        marginTop: 2,
      }}
    >
      <UtensilsCrossed size={10} color={colors.accent} />
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.xs,
          fontWeight: TOKENS.typography.weights.medium,
          color: colors.accent,
        }}
      >
        {truncate(recipeTitle, 20)}
      </Text>
    </View>
  );
}
