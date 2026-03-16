// Purpose: Hook wrapping pantryStore with computed expiry and search helpers

import { useMemo, useCallback } from 'react';
import { usePantryStore } from '../stores/pantryStore';
import { getPantryStatusColor } from '../lib/utils';
import type { PantryItem } from '../types';

export function usePantry() {
  const store = usePantryStore();

  const expiringItems = useMemo(
    () =>
      store.items.filter((item) => {
        if (!item.expiryDate) return false;
        return getPantryStatusColor(item.expiryDate) !== 'none';
      }),
    [store.items]
  );

  const itemsByCategory = useMemo(
    () => store.itemsByCategory(),
    [store.items]
  );

  const searchItems = useCallback(
    (query: string): PantryItem[] => {
      if (!query.trim()) return store.items;
      const lower = query.toLowerCase();
      return store.items.filter((i) =>
        i.name.toLowerCase().includes(lower)
      );
    },
    [store.items]
  );

  const hasIngredient = useCallback(
    (name: string): boolean =>
      store.items.some(
        (i) => i.name.toLowerCase() === name.toLowerCase() && i.quantity > 0
      ),
    [store.items]
  );

  return {
    items: store.items,
    lastScanResult: store.lastScanResult,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    addFromReceipt: store.addFromReceipt,
    clearScanResult: store.clearScanResult,
    expiringItems,
    itemsByCategory,
    searchItems,
    hasIngredient,
  };
}
