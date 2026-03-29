// Purpose: Hook wrapping groceryStore with aisle grouping

import { useMemo } from 'react';
import { useGroceryStore } from '../stores/groceryStore';

export function useGroceryList() {
  const store = useGroceryStore();

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

  return {
    items: store.items,
    isLoading: store.isLoading,
    itemsByAisle,
    uncheckedCount,
    checkedCount,
    totalItems,
    linkedRecipeIds: store.linkedRecipeIds,
    addItem: store.addItem,
    removeItem: store.removeItem,
    toggleChecked: store.toggleChecked,
    clearChecked: store.clearChecked,
    generateFromRecipes: store.generateFromRecipesApi,
    addRecipe: (recipeId: string) => store.generateFromRecipesApi([recipeId]),
  };
}
