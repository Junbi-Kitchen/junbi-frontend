// Purpose: Zustand store managing pantry items and receipt scan results

import { create } from 'zustand';
import type { PantryItem, IngredientCategory } from '../types';
import { MOCK_PANTRY } from '../lib/mockData';

interface PantryStore {
  items: PantryItem[];
  lastScanResult: PantryItem[] | null;
  addItem: (item: PantryItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  addFromReceipt: (items: PantryItem[]) => void;
  clearScanResult: () => void;
  itemsByCategory: () => Record<IngredientCategory, PantryItem[]>;
}

export const usePantryStore = create<PantryStore>((set, get) => ({
  items: MOCK_PANTRY,
  lastScanResult: null,

  addItem: (item) => {
    set((state) => ({
      items: [...state.items, item],
    }));
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  updateQuantity: (id, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity } : i
      ),
    }));
  },

  addFromReceipt: (items) => {
    set((state) => ({
      items: [...state.items, ...items],
      lastScanResult: items,
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
