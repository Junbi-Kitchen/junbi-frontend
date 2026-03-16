// Purpose: Redesigned pantry with visual category grid, quick-add chips, and smart search

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  Plus,
  Archive,
  Search,
  Camera,
  PenLine,
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
} from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { PantryItemRow } from '../../components/pantry/PantryItemRow';
import { ExpiryWarningBanner } from '../../components/pantry/ExpiryWarningBanner';
import { ReceiptScanModal } from '../../components/pantry/ReceiptScanModal';
import { ManualAddSheet } from '../../components/pantry/ManualAddSheet';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { Badge } from '../../components/ui/Badge';
import { usePantry } from '../../hooks/usePantry';
import { TOKENS } from '../../lib/tokens';
import { pluralize, getPantryStatusColor } from '../../lib/utils';
import type { IngredientCategory, PantryItem } from '../../types';

const { width: W } = Dimensions.get('window');
const TILE_SIZE = (W - 48 - 24) / 3;

const CATEGORY_META: Record<
  IngredientCategory,
  { label: string; icon: React.ComponentType<{ size: number; color: string }>; color: string; bg: string }
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

export default function PantryScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<IngredientCategory | null>(null);
  const [scanVisible, setScanVisible] = useState(false);
  const [loading] = useState(false);
  const manualSheetRef = useRef<BottomSheet>(null);
  const categorySheetRef = useRef<BottomSheet>(null);

  const {
    items,
    expiringItems,
    itemsByCategory,
    searchItems,
    removeItem,
    updateQuantity,
    addItem,
  } = usePantry();

  const displayItems = search
    ? searchItems(search)
    : activeCategory
      ? itemsByCategory[activeCategory] ?? []
      : null;

  const categories = Object.keys(itemsByCategory) as IngredientCategory[];

  const handleQuickAdd = (qa: typeof QUICK_ADD[0]) => {
    // Check if already in pantry — if so, increase quantity
    const existing = items.find((i) => i.name.toLowerCase() === qa.name.toLowerCase());
    if (existing) {
      updateQuantity(existing.id, existing.quantity + qa.defaultQty);
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
      addItem(newItem);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <View style={{ padding: 16, gap: 16 }}>
          <SkeletonLoader width="100%" height={48} borderRadius={12} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <SkeletonLoader width={TILE_SIZE} height={TILE_SIZE} borderRadius={16} />
            <SkeletonLoader width={TILE_SIZE} height={TILE_SIZE} borderRadius={16} />
            <SkeletonLoader width={TILE_SIZE} height={TILE_SIZE} borderRadius={16} />
          </View>
          <SkeletonLoader width="100%" height={120} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes['2xl'],
                  fontWeight: TOKENS.typography.weights.bold,
                  color: TOKENS.colors.text,
                }}
              >
                My Pantry
              </Text>
              <Text
                style={{
                  fontSize: TOKENS.typography.sizes.sm,
                  color: TOKENS.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {pluralize(items.length, 'item')} tracked
              </Text>
            </View>
            {/* Add buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setScanVisible(true)}
                accessibilityLabel="Scan receipt"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: TOKENS.colors.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={18} color={TOKENS.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => manualSheetRef.current?.expand()}
                accessibilityLabel="Add manually"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: TOKENS.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={18} color={TOKENS.colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View style={{ marginTop: 16 }}>
            <Input
              placeholder="Search your pantry..."
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                if (text) setActiveCategory(null);
              }}
              leftIcon={<Search size={16} color={TOKENS.colors.textMuted} />}
              rightIcon={
                search ? (
                  <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
                    <X size={16} color={TOKENS.colors.textMuted} />
                  </TouchableOpacity>
                ) : undefined
              }
            />
          </View>
        </View>

        {/* Expiry warning */}
        <ExpiryWarningBanner count={expiringItems.length} />

        {/* Quick Add chips */}
        {!search && !activeCategory && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingHorizontal: 20,
                marginBottom: 10,
              }}
            >
              Quick Add
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              {QUICK_ADD.map((qa) => {
                const inPantry = items.some((i) => i.name.toLowerCase() === qa.name.toLowerCase());
                return (
                  <TouchableOpacity
                    key={qa.name}
                    onPress={() => handleQuickAdd(qa)}
                    accessibilityLabel={`Quick add ${qa.name}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: inPantry ? TOKENS.colors.primaryMuted : TOKENS.colors.white,
                      borderWidth: 1,
                      borderColor: inPantry ? TOKENS.colors.primaryLight : TOKENS.colors.border,
                    }}
                  >
                    <Plus size={12} color={inPantry ? TOKENS.colors.primary : TOKENS.colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: TOKENS.typography.sizes.sm,
                        fontWeight: TOKENS.typography.weights.medium,
                        color: inPantry ? TOKENS.colors.primary : TOKENS.colors.text,
                      }}
                    >
                      {qa.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Category grid */}
        {!search && !activeCategory && categories.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              Categories
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingHorizontal: 20,
                gap: 12,
              }}
            >
              {categories.map((cat) => {
                const meta = CATEGORY_META[cat];
                const Icon = meta.icon;
                const count = (itemsByCategory[cat] ?? []).length;
                const hasExpiring = (itemsByCategory[cat] ?? []).some(
                  (i) => i.expiryDate && getPantryStatusColor(i.expiryDate) !== 'none'
                );
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    accessibilityLabel={`View ${meta.label}`}
                    style={{
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      borderRadius: 16,
                      backgroundColor: meta.bg,
                      padding: 12,
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {hasExpiring && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: TOKENS.colors.warning,
                        }}
                      />
                    )}
                    <Icon size={22} color={meta.color} />
                    <View>
                      <Text
                        style={{
                          fontSize: TOKENS.typography.sizes.sm,
                          fontWeight: TOKENS.typography.weights.semibold,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: TOKENS.typography.sizes.xs,
                          color: meta.color,
                          opacity: 0.7,
                        }}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Category detail view or search results */}
        {(activeCategory || search) && (
          <View style={{ marginTop: 12 }}>
            {activeCategory && !search && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.lg,
                      fontWeight: TOKENS.typography.weights.bold,
                      color: TOKENS.colors.text,
                    }}
                  >
                    {CATEGORY_META[activeCategory].label}
                  </Text>
                  <Badge
                    label={`${(displayItems ?? []).length}`}
                    variant="info"
                    size="sm"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setActiveCategory(null)}
                  accessibilityLabel="Back to all categories"
                >
                  <Text
                    style={{
                      fontSize: TOKENS.typography.sizes.sm,
                      fontWeight: TOKENS.typography.weights.semibold,
                      color: TOKENS.colors.primary,
                    }}
                  >
                    ← All
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {displayItems && displayItems.length > 0 ? (
              displayItems.map((item) => (
                <PantryItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onDelete={removeItem}
                />
              ))
            ) : (
              <Text
                style={{
                  textAlign: 'center',
                  color: TOKENS.colors.textSecondary,
                  marginTop: 32,
                  paddingHorizontal: 20,
                }}
              >
                {search ? `No items match "${search}"` : 'No items in this category'}
              </Text>
            )}
          </View>
        )}

        {/* Empty state */}
        {!search && !activeCategory && categories.length === 0 && (
          <EmptyState
            icon={Archive}
            title="Your pantry is empty"
            subtitle="Scan a receipt or quick-add common items to get started."
            ctaLabel="Add your first item"
            onCta={() => manualSheetRef.current?.expand()}
          />
        )}
      </ScrollView>

      {/* Manual add sheet */}
      <BottomSheetWrapper sheetRef={manualSheetRef} snapPoints={['80%']} initialIndex={-1}>
        <ManualAddSheet onClose={() => manualSheetRef.current?.close()} />
      </BottomSheetWrapper>

      {/* Receipt scan modal */}
      <ReceiptScanModal
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
      />
    </SafeAreaView>
  );
}
