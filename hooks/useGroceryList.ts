// Purpose: Hook wrapping groceryStore with aisle grouping and pantry-aware recipe adding

import { useMemo } from 'react';
import { useGroceryStore } from '../stores/groceryStore';
import { usePantryStore } from '../stores/pantryStore';
import type { Recipe } from '../types';

export function useGroceryList() {
  const store = useGroceryStore();
  const pantryStore = usePantryStore();

  const itemsByAisle = useMemo(() => {
    const grouped: Record<string, typeof store.items> = {};
    for (const item of store.items) {
      if (!grouped[item.aisle]) grouped[item.aisle] = [];
      grouped[item.aisle].push(item);
    }
    return grouped;
  }, [store.items]);

  const uncheckedCount = useMemo(
    () => store.items.filter((i) => !i.checked).length,
    [store.items]
  );

  const checkedCount = useMemo(
    () => store.items.filter((i) => i.checked).length,
    [store.items]
  );

  const totalItems = store.items.length;

  const addRecipe = (recipe: Recipe) => {
    store.addRecipeItems(recipe, pantryStore.items);
  };

  return {
    items: store.items,
    itemsByAisle,
    uncheckedCount,
    checkedCount,
    totalItems,
    linkedRecipeIds: store.linkedRecipeIds,
    addItem: store.addItem,
    removeItem: store.removeItem,
    toggleChecked: store.toggleChecked,
    clearChecked: store.clearChecked,
    generateFromRecipes: (recipeIds: string[], recipes: Recipe[]) =>
      store.generateFromRecipes(recipeIds, recipes, pantryStore.items),
    addRecipe,
  };
}
