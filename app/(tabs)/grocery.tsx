// Purpose: Grocery list screen with Instacart ordering, address management, and aisle/recipe grouping

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { ShoppingCart, MapPin, Navigation } from 'lucide-react-native';
import { GroceryListSection } from '../../components/grocery/GroceryListSection';
import { CartSummary } from '../../components/grocery/CartSummary';
import { StorePickerSheet } from '../../components/grocery/StorePickerSheet';
import { AddressPickerSheet } from '../../components/grocery/AddressPickerSheet';
import { BottomSheetWrapper } from '../../components/ui/BottomSheetWrapper';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useGroceryList } from '../../hooks/useGroceryList';
import { useOrders } from '../../hooks/useOrders';
import { useRecipeStore } from '../../stores/recipeStore';
import { useUserStore } from '../../stores/userStore';
import { TOKENS } from '../../lib/tokens';
import { truncate } from '../../lib/utils';

type GroupMode = 'aisle' | 'recipe';

export default function GroceryScreen() {
  const [groupMode, setGroupMode] = useState<GroupMode>('aisle');
  const [loading] = useState(false);
  const storeSheetRef = useRef<BottomSheet>(null);
  const addressSheetRef = useRef<BottomSheet>(null);

  const { items, itemsByAisle, uncheckedCount, totalItems, toggleChecked, removeItem, generateFromRecipes } =
    useGroceryList();
  const { selectedStore, selectStore } = useOrders();
  const { saved: savedRecipes } = useRecipeStore();
  const { user, getDefaultAddress } = useUserStore();
  const defaultAddress = getDefaultAddress();

  const aisles = Object.keys(itemsByAisle);

  // Group by recipe
  const itemsByRecipe: Record<string, typeof items> = {};
  for (const item of items) {
    const key = item.recipeTitle ?? 'Other';
    if (!itemsByRecipe[key]) itemsByRecipe[key] = [];
    itemsByRecipe[key].push(item);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonLoader width="100%" height={44} borderRadius={12} />
          <SkeletonLoader width="100%" height={200} borderRadius={12} />
          <SkeletonLoader width="100%" height={200} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text
          style={{
            fontSize: TOKENS.typography.sizes['2xl'],
            fontWeight: TOKENS.typography.weights.bold,
            color: TOKENS.colors.text,
            marginBottom: 8,
          }}
        >
          Grocery List
        </Text>

        {/* Location bar */}
        <TouchableOpacity
          onPress={() => addressSheetRef.current?.expand()}
          accessibilityLabel="Change delivery address"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: TOKENS.colors.inputBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Navigation size={14} color={TOKENS.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.xs,
                color: TOKENS.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              Deliver / Pickup to
            </Text>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: TOKENS.typography.weights.semibold,
                color: TOKENS.colors.text,
              }}
            >
              {defaultAddress
                ? truncate(`${defaultAddress.street}, ${defaultAddress.city}`, 35)
                : 'Set your address'}
            </Text>
          </View>
          <Text
            style={{
              fontSize: TOKENS.typography.sizes.xs,
              fontWeight: TOKENS.typography.weights.semibold,
              color: TOKENS.colors.primary,
            }}
          >
            Change
          </Text>
        </TouchableOpacity>

        {/* Store indicator */}
        {selectedStore && (
          <TouchableOpacity
            onPress={() => storeSheetRef.current?.expand()}
            accessibilityLabel="Change store"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: TOKENS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: TOKENS.colors.textSecondary }}>
                {selectedStore.name[0]}
              </Text>
            </View>
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.sm,
                fontWeight: TOKENS.typography.weights.medium,
                color: TOKENS.colors.text,
              }}
            >
              {selectedStore.name}
            </Text>
            {selectedStore.isInstacart && (
              <Badge label="via Instacart" variant="info" size="sm" />
            )}
            <Text
              style={{
                fontSize: TOKENS.typography.sizes.xs,
                color: TOKENS.colors.primary,
                fontWeight: TOKENS.typography.weights.semibold,
                marginLeft: 'auto',
              }}
            >
              Change
            </Text>
          </TouchableOpacity>
        )}

        {/* Toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: TOKENS.colors.inputBg,
            borderRadius: 12,
            padding: 4,
            marginBottom: 12,
          }}
        >
          {(['aisle', 'recipe'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setGroupMode(mode)}
              accessibilityLabel={`Group by ${mode}`}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor:
                  groupMode === mode ? TOKENS.colors.white : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: groupMode === mode ? '600' : '400',
                  color:
                    groupMode === mode
                      ? TOKENS.colors.text
                      : TOKENS.colors.textSecondary,
                  textTransform: 'capitalize',
                }}
              >
                By {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Generate from pantry gaps */}
        {savedRecipes.length > 0 && (
          <Button
            label="Generate from pantry gaps"
            variant="secondary"
            size="sm"
            onPress={() =>
              generateFromRecipes(
                savedRecipes.map((r) => r.id),
                savedRecipes
              )
            }
          />
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {totalItems === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your list is empty"
            subtitle="Save a recipe to automatically generate your grocery list."
          />
        ) : groupMode === 'aisle' ? (
          aisles.map((aisle) => (
            <GroceryListSection
              key={aisle}
              aisle={aisle}
              items={itemsByAisle[aisle]}
              onToggle={toggleChecked}
              onDelete={removeItem}
            />
          ))
        ) : (
          Object.entries(itemsByRecipe).map(([recipe, recipeItems]) => (
            <GroceryListSection
              key={recipe}
              aisle={recipe}
              items={recipeItems}
              onToggle={toggleChecked}
              onDelete={removeItem}
            />
          ))
        )}
        <View style={{ height: uncheckedCount > 0 ? 140 : 40 }} />
      </ScrollView>

      {/* Cart summary */}
      {uncheckedCount > 0 && (
        <CartSummary
          uncheckedCount={uncheckedCount}
          estimatedTotal={0}
          selectedStore={selectedStore}
          onStartOrder={() => storeSheetRef.current?.expand()}
        />
      )}

      {/* Store picker sheet */}
      <BottomSheetWrapper sheetRef={storeSheetRef} snapPoints={['75%']} initialIndex={-1}>
        <StorePickerSheet
          selectedStore={selectedStore}
          onSelect={selectStore}
          onConfirm={() => storeSheetRef.current?.close()}
        />
      </BottomSheetWrapper>

      {/* Address picker sheet */}
      <BottomSheetWrapper sheetRef={addressSheetRef} snapPoints={['65%']} initialIndex={-1}>
        <AddressPickerSheet
          onConfirm={() => addressSheetRef.current?.close()}
        />
      </BottomSheetWrapper>
    </SafeAreaView>
  );
}
