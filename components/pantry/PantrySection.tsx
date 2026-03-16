// Purpose: Collapsible pantry section grouped by ingredient category

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Leaf, Beef, Milk, Wheat, Archive, Snowflake,
  Coffee, Droplets, Sparkles, Croissant, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { PantryItemRow } from './PantryItemRow';
import { TOKENS } from '../../lib/tokens';
import type { IngredientCategory, PantryItem } from '../../types';

const CATEGORY_META: Record<
  IngredientCategory,
  { label: string; icon: React.ComponentType<{ size: number; color: string }> }
> = {
  produce: { label: 'Produce', icon: Leaf },
  proteins: { label: 'Proteins', icon: Beef },
  dairy: { label: 'Dairy', icon: Milk },
  grains: { label: 'Grains', icon: Wheat },
  pantry: { label: 'Pantry Staples', icon: Archive },
  frozen: { label: 'Frozen', icon: Snowflake },
  beverages: { label: 'Beverages', icon: Coffee },
  condiments: { label: 'Condiments', icon: Droplets },
  spices: { label: 'Spices', icon: Sparkles },
  bakery: { label: 'Bakery', icon: Croissant },
};

interface PantrySectionProps {
  category: IngredientCategory;
  items: PantryItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export function PantrySection({
  category,
  items,
  onUpdateQuantity,
  onDelete,
}: PantrySectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  return (
    <View style={{ marginBottom: 8 }}>
      {/* Section header */}
      <TouchableOpacity
        onPress={() => setCollapsed((c) => !c)}
        accessibilityLabel={`${collapsed ? 'Expand' : 'Collapse'} ${meta.label} section`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: TOKENS.colors.background,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: TOKENS.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Icon size={16} color={TOKENS.colors.primary} />
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.semibold,
            color: TOKENS.colors.text,
          }}
        >
          {meta.label}
        </Text>
        <View
          style={{
            backgroundColor: TOKENS.colors.primaryMuted,
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xs,
              fontWeight: TOKENS.typography.weights.semibold,
              color: TOKENS.colors.primary,
            }}
          >
            {items.length}
          </Text>
        </View>
        {collapsed ? (
          <ChevronDown size={18} color={TOKENS.colors.textSecondary} />
        ) : (
          <ChevronUp size={18} color={TOKENS.colors.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Items */}
      {!collapsed && (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PantryItemRow
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onDelete={onDelete}
            />
          )}
          estimatedItemSize={64}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}
