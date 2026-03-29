// Purpose: Zustand store managing the grocery list with pantry-aware generation

import { create } from 'zustand';
import type { GroceryItem } from '../types';
import { groceryApi } from '../lib/api/grocery';

interface GroceryStore {
  items: GroceryItem[];
  linkedRecipeIds: string[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<GroceryItem, 'id' | 'checked' | 'aisle'> & { category?: string }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleChecked: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  generateFromRecipesApi: (recipeIds: string[]) => Promise<void>;
}

export const useGroceryStore = create<GroceryStore>((set, get) => ({
  items: [],
  linkedRecipeIds: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const data = await groceryApi.get();
      set({ items: data.items, linkedRecipeIds: data.linkedRecipeIds });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    const created = await groceryApi.addItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      recipeId: item.recipeId,
      recipeTitle: item.recipeTitle,
    });
    set((state) => ({ items: [...state.items, created] }));
  },

  removeItem: async (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    await groceryApi.deleteItem(id);
  },

  toggleChecked: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const newChecked = !item.checked;
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, checked: newChecked } : i)),
    }));
    await groceryApi.updateItem(id, { checked: newChecked });
  },

  clearChecked: async () => {
    set((state) => ({ items: state.items.filter((i) => !i.checked) }));
    await groceryApi.clearChecked();
  },

  generateFromRecipesApi: async (recipeIds) => {
    const data = await groceryApi.generate(recipeIds);
    set({ items: data.items, linkedRecipeIds: data.linkedRecipeIds });
  },
}));
