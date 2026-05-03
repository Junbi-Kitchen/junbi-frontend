// Purpose: Bottom sheet for manually adding pantry items with ingredient search and quantity

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BottomSheetTextInput, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StepperInput } from '../ui/StepperInput';
import { Button } from '../ui/Button';
import { TOKENS } from '../../lib/tokens';
import { useTheme } from '../../hooks/useTheme';
import { usePantry } from '../../hooks/usePantry';
import { pantryApi } from '../../lib/api/pantry';
import type { IngredientCategory } from '../../types';

const UNITS = ['g', 'ml', 'whole', 'cup', 'tbsp', 'tsp', 'oz', 'lb', 'bunch', 'pack'];

interface Suggestion { name: string; category: string }

interface ManualAddSheetProps {
  onClose: () => void;
}

export function ManualAddSheet({ onClose }: ManualAddSheetProps) {
  const { colors } = useTheme();
  const { addItem } = usePantry();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('whole');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await pantryApi.searchIngredients(search.trim());
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [search]);

  const handleSelect = (suggestion: Suggestion) => {
    setSelected(suggestion);
    setSearch(suggestion.name);
    setSuggestions([]);
  };

  const handleAdd = async () => {
    const name = selected?.name || search.trim();
    if (!name) return;
    const category = (selected?.category as IngredientCategory) || 'pantry';
    await addItem({ name, quantity, unit, category, addedVia: 'manual' });
    setSearch('');
    setSelected(null);
    setQuantity(1);
    setUnit('whole');
    onClose();
  };

  const canAdd = search.trim().length > 0;

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes.xl,
            fontWeight: TOKENS.typography.weights.bold,
            color: colors.text,
            marginBottom: 16,
          }}
        >
          Add to Pantry
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            backgroundColor: colors.inputBg,
            height: 48,
            paddingHorizontal: 16,
          }}
        >
          <BottomSheetTextInput
            placeholder="Search or type an ingredient..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(t) => { setSearch(t); setSelected(null); }}
            style={{ flex: 1, fontSize: 16, color: colors.text }}
          />
        </View>

        {/* Suggestions dropdown */}
        {isSearching && (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {suggestions.length > 0 && (
          <BottomSheetScrollView
            style={{ maxHeight: 200, marginTop: 4 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.name}
                onPress={() => handleSelect(item)}
                accessibilityLabel={`Select ${item.name}`}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderRadius: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: TOKENS.typography.sizes.md, color: colors.text }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' }}>
                  {item.category}
                </Text>
              </TouchableOpacity>
            ))}
          </BottomSheetScrollView>
        )}

        {/* Quantity & unit — shown once user has typed/selected something */}
        {canAdd && (
          <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 }}>
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
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Quantity
              </Text>
              <StepperInput value={quantity} onChange={setQuantity} min={1} max={999} />
            </View>

            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: TOKENS.typography.weights.semibold,
                color: colors.textSecondary,
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
                    backgroundColor: unit === u ? colors.primaryMuted : colors.inputBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: unit === u ? colors.primary : colors.textSecondary,
                    }}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={{ paddingTop: 16, paddingBottom: 24 }}>
          <Button
            label="Add to Pantry"
            onPress={handleAdd}
            variant="primary"
            disabled={!canAdd}
            fullWidth
          />
        </View>
    </View>
  );
}
