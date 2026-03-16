// Purpose: Grocery list section grouped by aisle with checked/total count header

import React from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ShoppingBag } from 'lucide-react-native';
import { GroceryItemRow } from './GroceryItemRow';
import { TOKENS } from '../../lib/tokens';
import type { GroceryItem } from '../../types';

interface GroceryListSectionProps {
  aisle: string;
  items: GroceryItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function GroceryListSection({
  aisle,
  items,
  onToggle,
  onDelete,
}: GroceryListSectionProps) {
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: TOKENS.colors.background,
          gap: 8,
        }}
      >
        <ShoppingBag size={14} color={TOKENS.colors.textSecondary} />
        <Text
          style={{
            flex: 1,
            fontSize: TOKENS.typography.sizes.sm,
            fontWeight: TOKENS.typography.weights.semibold,
            color: TOKENS.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {aisle}
        </Text>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xs,
            color: TOKENS.colors.textSecondary,
          }}
        >
          {checkedCount}/{items.length}
        </Text>
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroceryItemRow
            item={item}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        )}
        estimatedItemSize={68}
        scrollEnabled={false}
      />
    </View>
  );
}
