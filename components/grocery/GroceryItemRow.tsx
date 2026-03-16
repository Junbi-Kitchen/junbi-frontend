// Purpose: Swipeable grocery list row with animated checkbox and recipe link tag

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { SwipeableRow } from '../ui/SwipeableRow';
import { RecipeLinkTag } from './RecipeLinkTag';
import { TOKENS } from '../../lib/tokens';
import type { GroceryItem } from '../../types';

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GroceryItemRow({
  item,
  onToggle,
  onDelete,
}: GroceryItemRowProps) {
  const checkScale = useSharedValue(item.checked ? 1 : 0);

  useEffect(() => {
    checkScale.value = withSpring(item.checked ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
  }, [item.checked]);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <SwipeableRow onDelete={() => onDelete(item.id)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: TOKENS.colors.white,
          borderBottomWidth: 1,
          borderBottomColor: TOKENS.colors.borderLight,
          opacity: item.checked ? 0.5 : 1,
        }}
      >
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(item.id)}
          accessibilityLabel={`${item.checked ? 'Uncheck' : 'Check'} ${item.name}`}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: item.checked
              ? TOKENS.colors.primary
              : TOKENS.colors.border,
            backgroundColor: item.checked
              ? TOKENS.colors.primary
              : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Animated.View style={checkAnimStyle}>
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          </Animated.View>
        </TouchableOpacity>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.md,
              fontWeight: TOKENS.typography.weights.medium,
              color: TOKENS.colors.text,
              textDecorationLine: item.checked ? 'line-through' : 'none',
            }}
          >
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: TOKENS.colors.textSecondary,
              marginTop: 1,
            }}
          >
            {item.quantity} {item.unit}
          </Text>
          {item.recipeTitle && (
            <RecipeLinkTag recipeTitle={item.recipeTitle} />
          )}
        </View>
      </View>
    </SwipeableRow>
  );
}
