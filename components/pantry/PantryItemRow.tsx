// Purpose: Single pantry item row with swipe-to-delete and stepper quantity control

import React from 'react';
import { View, Text } from 'react-native';
import { SwipeableRow } from '../ui/SwipeableRow';
import { StepperInput } from '../ui/StepperInput';
import { Badge } from '../ui/Badge';
import { getPantryStatusColor, getDaysUntilExpiry } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import type { PantryItem } from '../../types';

interface PantryItemRowProps {
  item: PantryItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onDelete: (id: string) => void;
}

export function PantryItemRow({
  item,
  onUpdateQuantity,
  onDelete,
}: PantryItemRowProps) {
  const { colors } = useTheme();
  const status = getPantryStatusColor(item.expiryDate);

  return (
    <SwipeableRow onDelete={() => onDelete(item.id)}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.md,
              fontWeight: TOKENS.typography.weights.medium,
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {item.name}
          </Text>
          {status === 'warning' && item.expiryDate && (
            <Badge
              label={`Expires in ${getDaysUntilExpiry(item.expiryDate)}d`}
              variant="warning"
              size="sm"
            />
          )}
          {status === 'expired' && (
            <Badge label="Expired" variant="dietary" size="sm" />
          )}
        </View>

        <StepperInput
          value={item.quantity}
          onChange={(q) => onUpdateQuantity(item.id, q)}
          min={0}
          max={999}
          unit={item.unit}
        />
      </View>
    </SwipeableRow>
  );
}
