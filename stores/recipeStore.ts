// Purpose: Zustand store managing the recipe feed, saved recipes, collections, and import queue

import { create } from 'zustand';
import type { Recipe, RecipeCollection, DietaryTag } from '../types';
import { MOCK_RECIPES, MOCK_COLLECTIONS } from '../lib/mockData';

interface RecipeStore {
  feed: Recipe[];
  saved: Recipe[];
  collections: RecipeCollection[];
  importQueue: Recipe[];
  activeFilters: DietaryTag[];
  loadFeed: () => void;
  saveRecipe: (recipe: Recipe) => void;
  unsaveRecipe: (id: string) => void;
  skipRecipe: (id: string) => void;
  addToImportQueue: (recipe: Recipe) => void;
  clearImportQueue: () => void;
  setFilters: (filters: DietaryTag[]) => void;
  createCollection: (name: string, emoji: string, description?: string) => void;
  addToCollection: (collectionId: string, recipeId: string) => void;
  removeFromCollection: (collectionId: string, recipeId: string) => void;
  deleteCollection: (id: string) => void;
  getRecipesForCollection: (collectionId: string) => Recipe[];
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  feed: MOCK_RECIPES,
  saved: MOCK_RECIPES.slice(0, 5), // Pre-seed some saved recipes for the Recipes tab
  collections: MOCK_COLLECTIONS,
  importQueue: [],
  activeFilters: [],

  loadFeed: () => {
    set({ feed: MOCK_RECIPES });
  },

  saveRecipe: (recipe) => {
    set((state) => ({
      feed: state.feed.filter((r) => r.id !== recipe.id),
      saved: state.saved.some((r) => r.id === recipe.id)
        ? state.saved
        : [recipe, ...state.saved],
    }));
  },

  unsaveRecipe: (id) => {
    set((state) => ({
      saved: state.saved.filter((r) => r.id !== id),
    }));
  },

  skipRecipe: (id) => {
    set((state) => ({
      feed: state.feed.filter((r) => r.id !== id),
    }));
  },

  addToImportQueue: (recipe) => {
    set((state) => ({
      importQueue: [...state.importQueue, recipe],
    }));
  },

  clearImportQueue: () => {
    set({ importQueue: [] });
  },

  setFilters: (filters) => {
    set({ activeFilters: filters });
    if (filters.length === 0) {
      set({ feed: MOCK_RECIPES });
    } else {
      set({
        feed: MOCK_RECIPES.filter((r) =>
          filters.every((f) => r.tags.includes(f))
        ),
      });
    }
  },

  createCollection: (name, emoji, description = '') => {
    const col: RecipeCollection = {
      id: `col-${Date.now()}`,
      name,
      emoji,
      description,
      coverImageUri: '',
      recipeIds: [],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      collections: [...state.collections, col],
    }));
  },

  addToCollection: (collectionId, recipeId) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId && !c.recipeIds.includes(recipeId)
          ? { ...c, recipeIds: [...c.recipeIds, recipeId] }
          : c
      ),
    }));
  },

  removeFromCollection: (collectionId, recipeId) => {
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId) }
          : c
      ),
    }));
  },

  deleteCollection: (id) => {
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    }));
  },

  getRecipesForCollection: (collectionId) => {
    const { collections, saved, feed } = get();
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return [];
    const allRecipes = [...saved, ...feed];
    return col.recipeIds
      .map((id) => allRecipes.find((r) => r.id === id))
      .filter((r): r is Recipe => r !== undefined);
  },
}));
