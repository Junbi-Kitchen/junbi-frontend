// Purpose: Compact grid-style recipe card for saved recipes and horizontal scrolls

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { formatCookTime, truncate } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import type { Recipe } from '../../types';

interface RecipeCardMiniProps {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCardMini({ recipe, onPress }: RecipeCardMiniProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`View recipe: ${recipe.title}`}
      style={{
        width: 160,
        borderRadius: 16,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        ...TOKENS.shadows.sm,
      }}
    >
      <Image
        source={{ uri: recipe.imageUri }}
        style={{ width: 160, height: 100 }}
        resizeMode="cover"
      />
      <View style={{ padding: 10 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.sm,
            fontWeight: TOKENS.typography.weights.semibold,
            color: colors.text,
            marginBottom: 6,
          }}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>
        {recipe.tags[0] && (
          <Badge
            label={recipe.tags[0]}
            variant="dietary"
            tag={recipe.tags[0]}
            size="sm"
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
          <Clock size={12} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xs,
              color: colors.textSecondary,
            }}
          >
            {formatCookTime(recipe.cookTimeMinutes)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
