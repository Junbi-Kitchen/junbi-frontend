// Purpose: Bottom sheet for selecting a pickup store with Instacart support and distance badges

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, MapPin, ShoppingBag } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TOKENS } from '../../lib/tokens';
import { MOCK_STORES } from '../../lib/mockData';
import type { Store } from '../../types';

interface StorePickerSheetProps {
  selectedStore: Store | null;
  onSelect: (store: Store) => void;
  onConfirm: () => void;
}

export function StorePickerSheet({
  selectedStore,
  onSelect,
  onConfirm,
}: StorePickerSheetProps) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <ShoppingBag size={18} color={TOKENS.colors.primary} />
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xl,
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
          }}
        >
          Choose Store
        </Text>
      </View>
      <Text
        style={{
          fontSize: TOKENS.typography.sizes.sm,
          color: TOKENS.colors.textSecondary,
          marginBottom: 16,
          marginTop: 4,
        }}
      >
        Order via Instacart for pickup or delivery
      </Text>

      {MOCK_STORES.map((store) => {
        const isSelected = selectedStore?.id === store.id;
        return (
          <TouchableOpacity
            key={store.id}
            onPress={() => onSelect(store)}
            accessibilityLabel={`Select ${store.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              marginBottom: 10,
              backgroundColor: isSelected
                ? TOKENS.colors.primaryMuted
                : TOKENS.colors.inputBg,
              borderWidth: isSelected ? 2 : 0,
              borderColor: TOKENS.colors.primary,
            }}
          >
            {/* Store logo placeholder */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: TOKENS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: TOKENS.colors.textSecondary,
                }}
              >
                {store.name[0]}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.md,
                  fontWeight: TOKENS.typography.weights.semibold,
                  color: TOKENS.colors.text,
                  marginBottom: 4,
                }}
              >
                {store.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <MapPin size={12} color={TOKENS.colors.textSecondary} />
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.xs,
                      color: TOKENS.colors.textSecondary,
                    }}
                  >
                    {store.distance} mi
                  </Text>
                </View>
                {store.supportsPickup && (
                  <Badge label="Pickup" variant="success" size="sm" />
                )}
                {store.isInstacart && (
                  <Badge label="Instacart" variant="info" size="sm" />
                )}
              </View>
            </View>

            {isSelected && (
              <Check size={20} color={TOKENS.colors.primary} />
            )}
          </TouchableOpacity>
        );
      })}

      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <Button
          label="Confirm Store"
          onPress={onConfirm}
          variant="primary"
          fullWidth
          disabled={!selectedStore}
        />
      </View>
    </View>
  );
}
