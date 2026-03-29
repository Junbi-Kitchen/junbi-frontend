// Purpose: Zustand store managing pantry items and receipt scan results

import { create } from 'zustand';
import type { PantryItem, IngredientCategory } from '../types';
import { pantryApi } from '../lib/api/pantry';

interface PantryStore {
  items: PantryItem[];
  isLoading: boolean;
  lastScanResult: PantryItem[] | null;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<PantryItem, 'id' | 'addedAt'>) => Promise<PantryItem>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  logAction: (id: string, action: 'used' | 'tossed', estimatedValue?: number) => Promise<{ action: string; estimatedValue: number }>;
  addFromReceipt: (items: Pick<PantryItem, 'name' | 'quantity' | 'unit' | 'category' | 'expiryDate' | 'addedVia'>[]) => Promise<void>;
  clearScanResult: () => void;
  itemsByCategory: () => Record<IngredientCategory, PantryItem[]>;
}

export const usePantryStore = create<PantryStore>((set, get) => ({
  items: [],
  isLoading: false,
  lastScanResult: null,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await pantryApi.getAll();
      set({ items });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const created = await pantryApi.add({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expiryDate: item.expiryDate ?? null,
      addedVia: item.addedVia,
    });
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },

  removeItem: async (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    await pantryApi.remove(id);
  },

  updateQuantity: async (id, quantity) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
    await pantryApi.update(id, { quantity });
  },

  logAction: async (id, action, estimatedValue = 0) => {
    const result = await pantryApi.logAction(id, action, estimatedValue);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    return result;
  },

  addFromReceipt: async (items) => {
    const created = await pantryApi.bulkAdd(
      items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiryDate: item.expiryDate ?? null,
        addedVia: 'receipt' as const,
      }))
    );
    set((state) => ({
      items: [...state.items, ...created],
      lastScanResult: created,
    }));
  },

  clearScanResult: () => {
    set({ lastScanResult: null });
  },

  itemsByCategory: () => {
    const { items } = get();
    const grouped = {} as Record<IngredientCategory, PantryItem[]>;
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return grouped;
  },
}));
