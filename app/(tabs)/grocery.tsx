// Purpose: Grocery tab — agentic grocery list with AI summary, simple checklist, and one-tap ordering

import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import {
  ShoppingCart,
  Navigation,
  Sparkles,
  Check,
  Trash2,
  Plus,
  Store as StoreIcon,
  ChevronDown,
  Package,
} from 'lucide-react-native';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { StorePickerSheet } from '../../components/grocery/StorePickerSheet';
import { AddressPickerSheet } from '../../components/grocery/AddressPickerSheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { useGroceryList } from '../../hooks/useGroceryList';
import { useOrders } from '../../hooks/useOrders';
import { useUserStore } from '../../stores/userStore';
import { TOKENS } from '../../lib/tokens';
import { truncate, pluralize } from '../../lib/utils';

export default function GroceryScreen() {
  const [loading] = useState(false);
  const storeSheetRef = useRef<BottomSheet>(null);
  const addressSheetRef = useRef<BottomSheet>(null);

  const { items, uncheckedCount, checkedCount, totalItems, toggleChecked, removeItem, clearChecked } =
    useGroceryList();
  const { selectedStore, selectStore } = useOrders();
  const { getDefaultAddress } = useUserStore();
  const defaultAddress = getDefaultAddress();

  // Split into unchecked and checked
  const uncheckedItems = useMemo(() => items.filter((i) => !i.checked), [items]);
  const checkedItems = useMemo(() => items.filter((i) => i.checked), [items]);

  // Group unchecked by aisle for clean display
  const aisleGroups = useMemo(() => {
    const groups: Record<string, typeof uncheckedItems> = {};
    for (const item of uncheckedItems) {
      const aisle = item.aisle || 'Other';
      if (!groups[aisle]) groups[aisle] = [];
      groups[aisle].push(item);
    }
    return groups;
  }, [uncheckedItems]);

  // Estimated total (mock: $3.49 avg per item)
  const estimatedTotal = uncheckedCount * 3.49;

  const handleToggle = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleChecked(id);
  };

  const handleClearChecked = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearChecked();
  };

  const handleOrder = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!selectedStore) {
      storeSheetRef.current?.expand();
    }
    // Future: actual ordering flow
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <View style={{ padding: 20, gap: 12 }}>
          <SkeletonLoader width="50%" height={28} borderRadius={8} />
          <SkeletonLoader width="100%" height={80} borderRadius={16} />
          <SkeletonLoader width="100%" height={200} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: totalItems > 0 ? 100 : 8 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes['2xl'],
              fontWeight: TOKENS.typography.weights.bold,
              color: TOKENS.colors.text,
            }}
          >
            Grocery
          </Text>
        </View>

        {totalItems === 0 ? (
          /* ─── Empty state ─────────────────────────── */
          <View style={{ paddingTop: 40 }}>
            <EmptyState
              icon={ShoppingCart}
              title="No groceries needed"
              subtitle="Your pantry's got you covered. When you need something, I'll add it here."
            />
          </View>
        ) : (
          <>
            {/* ─── AI summary card ──────────────────── */}
            <Animated.View entering={FadeInDown.duration(400).springify()}>
              <View
                style={{
                  marginHorizontal: 20,
                  marginTop: 12,
                  backgroundColor: TOKENS.colors.primaryMuted,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: TOKENS.colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                    }}
                  >
                    <Sparkles size={14} color={TOKENS.colors.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, lineHeight: 22, color: TOKENS.colors.text }}>
                      {uncheckedCount === 0
                        ? "You've checked everything off — nice work! Clear the list or add more items."
                        : uncheckedCount <= 3
                          ? `Almost done! Just ${uncheckedCount} ${uncheckedCount === 1 ? 'item' : 'items'} left to grab.`
                          : `You have ${uncheckedCount} items to get. Estimated ~$${estimatedTotal.toFixed(0)} total.`
                      }
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* ─── Delivery / Store bar ─────────────── */}
            <View style={{ paddingHorizontal: 20, marginTop: 16, gap: 8 }}>
              {/* Address */}
              <TouchableOpacity
                onPress={() => addressSheetRef.current?.expand()}
                accessibilityLabel="Change delivery address"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: TOKENS.colors.white,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: TOKENS.colors.borderLight,
                }}
              >
                <Navigation size={16} color={TOKENS.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: TOKENS.colors.text }}>
                    {defaultAddress
                      ? truncate(`${defaultAddress.street}, ${defaultAddress.city}`, 32)
                      : 'Set delivery address'}
                  </Text>
                </View>
                <ChevronDown size={16} color={TOKENS.colors.textMuted} />
              </TouchableOpacity>

              {/* Store */}
              <TouchableOpacity
                onPress={() => storeSheetRef.current?.expand()}
                accessibilityLabel="Select store"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: TOKENS.colors.white,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: TOKENS.colors.borderLight,
                }}
              >
                <StoreIcon size={16} color={TOKENS.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: TOKENS.colors.text }}>
                    {selectedStore ? selectedStore.name : 'Pick a store'}
                  </Text>
                  {selectedStore?.isInstacart && (
                    <Text style={{ fontSize: 11, color: TOKENS.colors.textSecondary, marginTop: 1 }}>
                      via Instacart
                    </Text>
                  )}
                </View>
                <ChevronDown size={16} color={TOKENS.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* ─── Items to get ──────────────────────── */}
            {uncheckedCount > 0 && (
              <View style={{ marginTop: 20 }}>
                <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: TOKENS.colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    To get · {uncheckedCount}
                  </Text>
                </View>

                {Object.entries(aisleGroups).map(([aisle, aisleItems]) => (
                  <View key={aisle}>
                    {/* Aisle label */}
                    <View
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 6,
                        backgroundColor: TOKENS.colors.inputBg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: TOKENS.colors.textSecondary,
                          textTransform: 'uppercase',
                          letterSpacing: 0.3,
                        }}
                      >
                        {aisle}
                      </Text>
                    </View>

                    {aisleItems.map((item) => (
                      <GroceryRow
                        key={item.id}
                        name={item.name}
                        detail={`${item.quantity} ${item.unit}`}
                        checked={false}
                        recipeTitle={item.recipeTitle}
                        onToggle={() => handleToggle(item.id)}
                        onDelete={() => removeItem(item.id)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* ─── Checked items (done) ─────────────── */}
            {checkedCount > 0 && (
              <View style={{ marginTop: 24 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: TOKENS.colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Done · {checkedCount}
                  </Text>
                  <TouchableOpacity
                    onPress={handleClearChecked}
                    accessibilityLabel="Clear checked items"
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: TOKENS.colors.inputBg,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '500', color: TOKENS.colors.textSecondary }}>
                      Clear all
                    </Text>
                  </TouchableOpacity>
                </View>

                {checkedItems.map((item) => (
                  <GroceryRow
                    key={item.id}
                    name={item.name}
                    detail={`${item.quantity} ${item.unit}`}
                    checked
                    onToggle={() => handleToggle(item.id)}
                    onDelete={() => removeItem(item.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ─── Sticky order button ───────────────────── */}
      {uncheckedCount > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: TOKENS.colors.white,
            borderTopWidth: 1,
            borderTopColor: TOKENS.colors.borderLight,
          }}
        >
          <TouchableOpacity
            onPress={handleOrder}
            accessibilityLabel={`Order ${uncheckedCount} items`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: TOKENS.colors.primary,
              borderRadius: 14,
              paddingVertical: 16,
            }}
          >
            <Package size={18} color={TOKENS.colors.white} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: TOKENS.colors.white,
              }}
            >
              {selectedStore
                ? `Order from ${selectedStore.name}`
                : `Order ${pluralize(uncheckedCount, 'item')} · ~$${estimatedTotal.toFixed(0)}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Bottom sheets ─────────────────────────── */}
      <BottomSheetWrapper sheetRef={storeSheetRef} snapPoints={['75%']} initialIndex={-1}>
        <StorePickerSheet
          selectedStore={selectedStore}
          onSelect={selectStore}
          onConfirm={() => storeSheetRef.current?.close()}
        />
      </BottomSheetWrapper>

      <BottomSheetWrapper sheetRef={addressSheetRef} snapPoints={['65%']} initialIndex={-1}>
        <AddressPickerSheet
          onConfirm={() => addressSheetRef.current?.close()}
        />
      </BottomSheetWrapper>
    </SafeAreaView>
  );
}

// ─── Grocery item row ───────────────────────────────────────

function GroceryRow({
  name,
  detail,
  checked,
  recipeTitle,
  onToggle,
  onDelete,
}: {
  name: string;
  detail: string;
  checked: boolean;
  recipeTitle?: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: TOKENS.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: TOKENS.colors.borderLight,
      }}
    >
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        accessibilityLabel={`${checked ? 'Uncheck' : 'Check'} ${name}`}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? TOKENS.colors.primary : TOKENS.colors.border,
          backgroundColor: checked ? TOKENS.colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {checked && <Check size={13} color={TOKENS.colors.white} strokeWidth={3} />}
      </TouchableOpacity>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '500',
            color: checked ? TOKENS.colors.textMuted : TOKENS.colors.text,
            textDecorationLine: checked ? 'line-through' : 'none',
          }}
        >
          {name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <Text style={{ fontSize: 12, color: TOKENS.colors.textSecondary }}>
            {detail}
          </Text>
          {recipeTitle && !checked && (
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 999,
                backgroundColor: TOKENS.colors.accentLight,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '500', color: TOKENS.colors.accent }}>
                {recipeTitle}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete */}
      {checked && (
        <TouchableOpacity
          onPress={onDelete}
          accessibilityLabel={`Remove ${name}`}
          style={{ padding: 4 }}
        >
          <Trash2 size={16} color={TOKENS.colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}
