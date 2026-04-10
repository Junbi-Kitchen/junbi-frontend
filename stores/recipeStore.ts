// Purpose: Zustand store managing the recipe feed, saved recipes, collections, and import queue

import { create } from 'zustand';
import type { Recipe, RecipeCollection, DietaryTag } from '../types';
import { recipesApi } from '../lib/api/recipes';
import { collectionsApi } from '../lib/api/collections';

interface RecipeStore {
  feed: Recipe[];
  feedCursor: string | null;
  saved: Recipe[];
  collections: RecipeCollection[];
  importQueue: Recipe[];
  activeFilters: DietaryTag[];
  isLoading: boolean;

  fetchSaved: () => Promise<void>;
  fetchCollections: () => Promise<void>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  unsaveRecipe: (id: string) => Promise<void>;
  skipRecipe: (id: string) => Promise<void>;
  addToImportQueue: (recipe: Recipe) => void;
  clearImportQueue: () => void;
  setFilters: (filters: DietaryTag[]) => void;
  createCollection: (name: string, emoji: string, description?: string) => Promise<void>;
  updateCollection: (id: string, data: { name?: string; emoji?: string; description?: string }) => Promise<void>;
  addToCollection: (collectionId: string, recipeId: string) => Promise<void>;
  removeFromCollection: (collectionId: string, recipeId: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  getRecipesForCollection: (collectionId: string) => Recipe[];
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  feed: [],
  feedCursor: null,
  saved: [],
  collections: [],
  importQueue: [],
  activeFilters: [],
  isLoading: false,

  fetchSaved: async () => {
    set({ isLoading: true });
    try {
      const data = await recipesApi.getSaved();
      set({ saved: data.recipes });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCollections: async () => {
    const data = await collectionsApi.getAll();
    set({ collections: data });
  },

  saveRecipe: async (recipe) => {
    set((state) => ({
      feed: state.feed.filter((r) => r.id !== recipe.id),
      saved: state.saved.some((r) => r.id === recipe.id)
        ? state.saved
        : [recipe, ...state.saved],
    }));
    await recipesApi.save(recipe.id);
  },

  unsaveRecipe: async (id) => {
    set((state) => ({ saved: state.saved.filter((r) => r.id !== id) }));
    await recipesApi.unsave(id);
  },

  skipRecipe: async (id) => {
    set((state) => ({ feed: state.feed.filter((r) => r.id !== id) }));
    await recipesApi.skip(id);
  },

  addToImportQueue: (recipe) => {
    set((state) => ({ importQueue: [...state.importQueue, recipe] }));
  },

  clearImportQueue: () => {
    set({ importQueue: [] });
  },

  setFilters: (filters) => {
    set({ activeFilters: filters });
  },

  createCollection: async (name, emoji, description = '') => {
    const col = await collectionsApi.create({ name, emoji, description });
    set((state) => ({ collections: [...state.collections, col] }));
  },

  updateCollection: async (id, data) => {
    const updated = await collectionsApi.update(id, data);
    set((state) => ({
      collections: state.collections.map((c) => (c.id === id ? updated : c)),
    }));
  },

  addToCollection: async (collectionId, recipeId) => {
    await collectionsApi.addRecipe(collectionId, recipeId);
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId && !c.recipeIds.includes(recipeId)
          ? { ...c, recipeIds: [...c.recipeIds, recipeId] }
          : c
      ),
    }));
  },

  removeFromCollection: async (collectionId, recipeId) => {
    await collectionsApi.removeRecipe(collectionId, recipeId);
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId
          ? { ...c, recipeIds: c.recipeIds.filter((id) => id !== recipeId) }
          : c
      ),
    }));
  },

  deleteCollection: async (id) => {
    await collectionsApi.delete(id);
    set((state) => ({ collections: state.collections.filter((c) => c.id !== id) }));
  },

  getRecipesForCollection: (collectionId) => {
    const { collections, saved } = get();
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return [];
    return col.recipeIds
      .map((id) => saved.find((r) => r.id === id))
      .filter((r): r is Recipe => r !== undefined);
  },
}));
