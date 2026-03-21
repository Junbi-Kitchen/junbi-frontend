// Purpose: Bottom sheet for manually adding pantry items with search, quantity, and expiry

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Input } from '../ui/Input';
import { StepperInput } from '../ui/StepperInput';
import { Button } from '../ui/Button';
import { TOKENS } from '../../lib/tokens';
import { usePantry } from '../../hooks/usePantry';
import { MOCK_PANTRY } from '../../lib/mockData';
import type { IngredientCategory, PantryItem } from '../../types';

const COMMON_INGREDIENTS = [
  ...new Map(MOCK_PANTRY.map((i) => [i.name, i])).values(),
];

const UNITS = ['g', 'ml', 'whole', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'pack'];

interface ManualAddSheetProps {
  onClose: () => void;
}

export function ManualAddSheet({ onClose }: ManualAddSheetProps) {
  const { addItem } = usePantry();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('g');

  const filtered = COMMON_INGREDIENTS.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!selected) return;
    const base = COMMON_INGREDIENTS.find((i) => i.name === selected);
    if (!base) return;

    const newItem: PantryItem = {
      id: `manual-${Date.now()}`,
      name: base.name,
      quantity,
      unit,
      category: base.category as IngredientCategory,
      addedAt: new Date().toISOString(),
      addedVia: 'manual',
    };
    addItem(newItem);
    setSearch('');
    setSelected(null);
    setQuantity(1);
    setUnit('g');
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xl,
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
            marginBottom: 16,
          }}
        >
          Add to Pantry
        </Text>

        <Input
          placeholder="Search ingredients..."
          value={search}
          onChangeText={setSearch}
        />

        {/* Ingredient list */}
        <ScrollView
          style={{ flex: 1, marginTop: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.map((item) => (
            <TouchableOpacity
              key={item.name}
              onPress={() => setSelected(item.name)}
              accessibilityLabel={`Select ${item.name}`}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 10,
                backgroundColor:
                  selected === item.name
                    ? TOKENS.colors.primaryMuted
                    : 'transparent',
                marginBottom: 2,
              }}
            >
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.md,
                  color:
                    selected === item.name
                      ? TOKENS.colors.primary
                      : TOKENS.colors.text,
                  fontWeight:
                    selected === item.name
                      ? TOKENS.typography.weights.semibold
                      : TOKENS.typography.weights.regular,
                }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quantity & unit — only when selected */}
        {selected && (
          <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: TOKENS.colors.borderLight }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  fontWeight: TOKENS.typography.weights.semibold,
                  color: TOKENS.colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Quantity
              </Text>
              <StepperInput value={quantity} onChange={setQuantity} min={1} max={999} />
            </View>

            {/* Unit picker */}
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.textSecondary,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Unit
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  accessibilityLabel={`Select unit ${u}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor:
                      unit === u ? TOKENS.colors.primaryMuted : TOKENS.colors.inputBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color:
                        unit === u
                          ? TOKENS.colors.primary
                          : TOKENS.colors.textSecondary,
                    }}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sticky bottom button */}
        <View style={{ paddingTop: 16, paddingBottom: 24 }}>
          <Button
            label="Add to Pantry"
            onPress={handleAdd}
            variant="primary"
            disabled={!selected}
            fullWidth
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
