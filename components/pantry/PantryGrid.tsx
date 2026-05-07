// Purpose: Reusable pantry chip grid grouped by category — extracted from the old home screen

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Archive,
  Search,
  Camera,
  Leaf,
  Beef,
  Milk,
  Wheat,
  Snowflake,
  Coffee,
  Droplets,
  Sparkles,
  Croissant,
  X,
  Zap,
  Check,
} from 'lucide-react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Input } from '../ui/Input';
import { BottomSheetWrapper } from '../ui/BottomSheetWrapper';
import { ManualAddSheet } from './ManualAddSheet';
import { ReceiptScanModal } from './ReceiptScanModal';
import { ExpiryWarningBanner } from './ExpiryWarningBanner';
import { EmptyState } from '../ui/EmptyState';
import { useTheme } from '../../hooks/useTheme';
import { TOKENS } from '../../lib/tokens';
import { pluralize, getPantryStatusColor } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import type { IngredientCategory, PantryItem } from '../../types';

const CATEGORY_META: Record<
  IngredientCategory,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  produce: { label: 'Produce', icon: Leaf, color: '#16A34A', bg: '#DCFCE7' },
  proteins: { label: 'Protein', icon: Beef, color: '#DC2626', bg: '#FEE2E2' },
  dairy: { label: 'Dairy', icon: Milk, color: '#2563EB', bg: '#DBEAFE' },
  grains: { label: 'Grains', icon: Wheat, color: '#D97706', bg: '#FEF3C7' },
  pantry: { label: 'Staples', icon: Archive, color: '#7C3AED', bg: '#EDE9FE' },
  frozen: { label: 'Frozen', icon: Snowflake, color: '#0891B2', bg: '#CFFAFE' },
  beverages: { label: 'Drinks', icon: Coffee, color: '#92400E', bg: '#FDE8CD' },
  condiments: { label: 'Sauces', icon: Droplets, color: '#EA580C', bg: '#FFF7ED' },
  spices: { label: 'Spices', icon: Sparkles, color: '#BE185D', bg: '#FCE7F3' },
  bakery: { label: 'Bakery', icon: Croissant, color: '#B45309', bg: '#FEF3C7' },
};

export { CATEGORY_META };

const QUICK_ADD = [
  { name: 'Eggs', category: 'proteins' as IngredientCategory, unit: 'whole', defaultQty: 12 },
  { name: 'Milk', category: 'dairy' as IngredientCategory, unit: 'L', defaultQty: 1 },
  { name: 'Bread', category: 'bakery' as IngredientCategory, unit: 'loaf', defaultQty: 1 },
  { name: 'Butter', category: 'dairy' as IngredientCategory, unit: 'g', defaultQty: 250 },
  { name: 'Rice', category: 'grains' as IngredientCategory, unit: 'kg', defaultQty: 1 },
  { name: 'Chicken', category: 'proteins' as IngredientCategory, unit: 'g', defaultQty: 500 },
  { name: 'Onions', category: 'produce' as IngredientCategory, unit: 'whole', defaultQty: 3 },
  { name: 'Garlic', category: 'produce' as IngredientCategory, unit: 'head', defaultQty: 1 },
];

interface PantryGridProps {
  items: PantryItem[];
  itemsByCategory: Partial<Record<IngredientCategory, PantryItem[]>>;
  expiringCount: number;
  search: string;
  onSearchChange: (text: string) => void;
  searchItems: (query: string) => PantryItem[];
  onChipTap: (item: PantryItem) => void;
  onAddItem: (item: PantryItem) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  manualSheetRef: React.RefObject<BottomSheet | null>;
  quickAddSheetRef: React.RefObject<BottomSheet | null>;
  scanVisible: boolean;
  onScanOpen: () => void;
  onScanClose: () => void;
}

export function PantryGrid({
  items,
  itemsByCategory,
  expiringCount,
  search,
  onSearchChange,
  searchItems,
  onChipTap,
  onAddItem,
  onUpdateQuantity,
  manualSheetRef,
  quickAddSheetRef,
  scanVisible,
  onScanOpen,
  onScanClose,
}: PantryGridProps) {
  const { colors } = useTheme();
  const handleQuickAdd = async (qa: typeof QUICK_ADD[0]) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const existing = items.find((i) => i.name.toLowerCase() === qa.name.toLowerCase());
    if (existing) {
      onUpdateQuantity(existing.id, existing.quantity + qa.defaultQty);
    } else {
      const newItem: PantryItem = {
        id: `quick-${Date.now()}-${qa.name}`,
        name: qa.name,
        quantity: qa.defaultQty,
        unit: qa.unit,
        category: qa.category,
        addedAt: new Date().toISOString(),
        addedVia: 'manual',
      };
      onAddItem(newItem);
    }
  };

  const getChipBorderColor = (item: PantryItem): string => {
    if (!item.expiryDate) return 'transparent';
    const status = getPantryStatusColor(item.expiryDate);
    if (status === 'expired') return colors.error;
    if (status === 'warning') return colors.warning;
    return 'transparent';
  };

  const filteredCategories = search
    ? (() => {
        const results = searchItems(search);
        const grouped: Partial<Record<IngredientCategory, PantryItem[]>> = {};
        for (const item of results) {
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category]!.push(item);
        }
        return grouped;
      })()
    : itemsByCategory;

  const visibleCategories = (Object.keys(filteredCategories) as IngredientCategory[]).filter(
    (cat) => (filteredCategories[cat] ?? []).length > 0
  );

  return (
    <>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes['2xl'],
                fontWeight: TOKENS.typography.weights.bold,
                color: colors.text,
              }}
            >
              My Pantry
            </Text>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {pluralize(items.length, 'item')} tracked
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={onScanOpen}
              accessibilityLabel="Scan receipt"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.primaryMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Camera size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => manualSheetRef.current?.expand()}
              accessibilityLabel="Add manually"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{ marginTop: 16 }}>
          <Input
            placeholder="Search your pantry..."
            value={search}
            onChangeText={onSearchChange}
            leftIcon={<Search size={16} color={colors.textMuted} />}
            rightIcon={
              search ? (
                <TouchableOpacity onPress={() => onSearchChange('')} accessibilityLabel="Clear search">
                  <X size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : undefined
            }
          />
        </View>
      </View>

      <ExpiryWarningBanner count={expiringCount} />

      {/* Quick Add button */}
      {!search && (
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => quickAddSheetRef.current?.expand()}
            accessibilityLabel="Quick add common items"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.primaryMuted,
            }}
          >
            <Zap size={16} color={colors.primary} />
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.md,
                fontWeight: TOKENS.typography.weights.semibold,
                color: colors.primary,
              }}
            >
              Quick Add
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category groups with item chips */}
      {visibleCategories.length > 0 ? (
        <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
          {visibleCategories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const catItems = filteredCategories[cat] ?? [];
            return (
              <View key={cat} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: meta.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={14} color={meta.color} />
                  </View>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.md,
                      fontWeight: TOKENS.typography.weights.semibold,
                      color: colors.text,
                    }}
                  >
                    {meta.label}
                  </Text>
                  <Text style={{ fontSize: TOKENS.typography.sizes.xs, color: colors.textMuted }}>
                    ({catItems.length})
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {catItems.map((item) => {
                    const borderColor = getChipBorderColor(item);
                    const isExpiring = borderColor !== 'transparent';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => onChipTap(item)}
                        accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit}. Tap to edit.`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: colors.surface,
                          borderWidth: isExpiring ? 1.5 : 1,
                          borderColor: isExpiring ? borderColor : colors.border,
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: TOKENS.typography.sizes.sm,
                            fontWeight: TOKENS.typography.weights.medium,
                            color: colors.text,
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: TOKENS.typography.sizes.xs, color: colors.textSecondary }}>
                          {item.quantity}{item.unit !== 'whole' ? item.unit : 'x'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ marginTop: 20 }}>
          {search ? (
            <Text
              style={{
                textAlign: 'center',
                color: colors.textSecondary,
                marginTop: 32,
                paddingHorizontal: 20,
                fontSize: TOKENS.typography.sizes.md,
              }}
            >
              No items match "{search}"
            </Text>
          ) : (
            <EmptyState
              icon={Archive}
              title="Your pantry is empty"
              subtitle="Scan a receipt or quick-add common items to get started."
              ctaLabel="Add your first item"
              onCta={() => manualSheetRef.current?.expand()}
            />
          )}
        </View>
      )}

      {/* Quick Add sheet */}
      <BottomSheetWrapper sheetRef={quickAddSheetRef} snapPoints={['55%']} initialIndex={-1}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xl,
              fontWeight: TOKENS.typography.weights.bold,
              color: colors.text,
              marginBottom: 6,
            }}
          >
            Quick Add
          </Text>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.sm,
              color: colors.textSecondary,
              marginBottom: 20,
            }}
          >
            Tap to add common items to your pantry
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {QUICK_ADD.map((qa) => {
              const inPantry = items.some((i) => i.name.toLowerCase() === qa.name.toLowerCase());
              return (
                <TouchableOpacity
                  key={qa.name}
                  onPress={() => handleQuickAdd(qa)}
                  accessibilityLabel={`${inPantry ? 'Already added' : 'Add'} ${qa.name}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: inPantry ? colors.primaryMuted : colors.inputBg,
                    borderWidth: inPantry ? 1.5 : 0,
                    borderColor: colors.primaryLight,
                  }}
                >
                  {inPantry ? (
                    <Check size={14} color={colors.primary} />
                  ) : (
                    <Plus size={14} color={colors.textSecondary} />
                  )}
                  <View>
                    <Text
                      style={{
                        fontSize: TOKENS.typography.sizes.md,
                        fontWeight: TOKENS.typography.weights.medium,
                        color: inPantry ? colors.primary : colors.text,
                      }}
                    >
                      {qa.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: TOKENS.typography.sizes.xs,
                        color: inPantry ? colors.primary : colors.textSecondary,
                        marginTop: 1,
                      }}
                    >
                      {qa.defaultQty} {qa.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </BottomSheetWrapper>

      {/* Manual add sheet */}
      <BottomSheetWrapper sheetRef={manualSheetRef} snapPoints={['80%']} initialIndex={-1}>
        <ManualAddSheet onClose={() => manualSheetRef.current?.close()} />
      </BottomSheetWrapper>

      {/* Receipt scan modal */}
      <ReceiptScanModal visible={scanVisible} onClose={onScanClose} />
    </>
  );
}
