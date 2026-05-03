// Purpose: Sticky bottom bar showing cart summary and pickup order CTA

import React from 'react';
import { View, Text } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { pluralize } from '../../lib/utils';
import type { Store } from '../../types';

interface CartSummaryProps {
  uncheckedCount: number;
  estimatedTotal: number;
  onStartOrder: () => void;
  selectedStore?: Store | null;
}

export function CartSummary({
  uncheckedCount,
  estimatedTotal,
  onStartOrder,
  selectedStore,
}: CartSummaryProps) {
  const { colors } = useTheme();
  if (uncheckedCount === 0) return null;

  const canOrder = Boolean(selectedStore);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
        ...TOKENS.shadows.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <ShoppingCart size={18} color={colors.primary} />
        <Text
          style={{
            flex: 1,
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.semibold,
            color: colors.text,
            marginLeft: 8,
          }}
        >
          {pluralize(uncheckedCount, 'item')} to get
        </Text>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.md,
            fontWeight: TOKENS.typography.weights.semibold,
            color: colors.text,
          }}
        >
          ${estimatedTotal.toFixed(2)}
        </Text>
      </View>

      {selectedStore && (
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.sm,
            color: colors.textSecondary,
            marginBottom: 12,
          }}
        >
          Pickup from {selectedStore.name}
        </Text>
      )}

      {!canOrder && (
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xs,
            color: colors.accent,
            marginBottom: 8,
          }}
        >
          Select a store to place a pickup order
        </Text>
      )}

      <Button
        label="Start Pickup Order"
        onPress={onStartOrder}
        variant="primary"
        fullWidth
        disabled={!canOrder}
      />
    </View>
  );
}
