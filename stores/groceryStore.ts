// Purpose: Zustand store managing the grocery list with pantry-aware generation

import { create } from 'zustand';
import type { GroceryItem, Recipe, PantryItem } from '../types';
import { MOCK_GROCERY_LIST } from '../lib/mockData';
import { getAisleFromCategory } from '../lib/utils';

interface GroceryStore {
  items: GroceryItem[];
  linkedRecipeIds: string[];
  addItem: (item: GroceryItem) => void;
  removeItem: (id: string) => void;
  toggleChecked: (id: string) => void;
  clearChecked: () => void;
  generateFromRecipes: (recipeIds: string[], recipes: Recipe[], pantryItems: PantryItem[]) => void;
  addRecipeItems: (recipe: Recipe, pantryItems: PantryItem[]) => void;
}

export const useGroceryStore = create<GroceryStore>((set, get) => ({
  items: MOCK_GROCERY_LIST,
  linkedRecipeIds: [],

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

  toggleChecked: (id) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, checked: !i.checked } : i
      ),
    }));
  },

  clearChecked: () => {
    set((state) => ({
      items: state.items.filter((i) => !i.checked),
    }));
  },

  generateFromRecipes: (recipeIds, recipes, pantryItems) => {
    const selectedRecipes = recipes.filter((r) => recipeIds.includes(r.id));
    const allIngredients = selectedRecipes.flatMap((r) =>
      r.ingredients.map((ing) => ({ ...ing, recipeId: r.id, recipeTitle: r.title }))
    );

    // Deduplicate by name and subtract pantry quantities
    const merged = new Map<string, GroceryItem>();
    for (const ing of allIngredients) {
      const pantryMatch = pantryItems.find(
        (p) => p.name.toLowerCase() === ing.name.toLowerCase()
      );
      const needed = ing.quantity - (pantryMatch?.quantity ?? 0);
      if (needed <= 0) continue;

      const key = ing.name.toLowerCase();
      if (merged.has(key)) {
        const existing = merged.get(key)!;
        merged.set(key, { ...existing, quantity: existing.quantity + needed });
      } else {
        merged.set(key, {
          id: `gen-${ing.id}-${Date.now()}`,
          name: ing.name,
          quantity: needed,
          unit: ing.unit,
          recipeId: ing.recipeId,
          recipeTitle: ing.recipeTitle,
          checked: false,
          aisle: getAisleFromCategory(ing.category),
        });
      }
    }

    set({
      items: Array.from(merged.values()),
      linkedRecipeIds: recipeIds,
    });
  },

  addRecipeItems: (recipe, pantryItems) => {
    const { items } = get();
    const newItems: GroceryItem[] = [];

    for (const ing of recipe.ingredients) {
      const pantryMatch = pantryItems.find(
        (p) => p.name.toLowerCase() === ing.name.toLowerCase()
      );
      const needed = ing.quantity - (pantryMatch?.quantity ?? 0);
      if (needed <= 0) continue;

      const existingIdx = items.findIndex(
        (i) => i.name.toLowerCase() === ing.name.toLowerCase()
      );
      if (existingIdx >= 0) {
        // Update existing quantity
        set((state) => ({
          items: state.items.map((item, idx) =>
            idx === existingIdx
              ? { ...item, quantity: item.quantity + needed }
              : item
          ),
        }));
      } else {
        newItems.push({
          id: `recipe-${ing.id}-${Date.now()}`,
          name: ing.name,
          quantity: needed,
          unit: ing.unit,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          checked: false,
          aisle: getAisleFromCategory(ing.category),
        });
      }
    }

    if (newItems.length > 0) {
      set((state) => ({
        items: [...state.items, ...newItems],
        linkedRecipeIds: state.linkedRecipeIds.includes(recipe.id)
          ? state.linkedRecipeIds
          : [...state.linkedRecipeIds, recipe.id],
      }));
    }
  },
}));
