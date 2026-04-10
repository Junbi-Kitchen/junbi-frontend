import { api } from '../api';
import type { RecipeCollection } from '../../types';

export const collectionsApi = {
  getAll: () => api.get<RecipeCollection[]>('/collections'),
  create: (data: { name: string; description?: string; coverImageUri?: string; emoji?: string }) =>
    api.post<RecipeCollection>('/collections', data),
  update: (id: string, data: { name?: string; description?: string; coverImageUri?: string; emoji?: string }) =>
    api.patch<RecipeCollection>(`/collections/${id}`, data),
  delete: (id: string) => api.delete<{ detail: string }>(`/collections/${id}`),
  addRecipe: (collectionId: string, recipeId: string) =>
    api.post<{ detail: string }>(`/collections/${collectionId}/recipes/${recipeId}`),
  removeRecipe: (collectionId: string, recipeId: string) =>
    api.delete<{ detail: string }>(`/collections/${collectionId}/recipes/${recipeId}`),
};
