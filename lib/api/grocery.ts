import { api } from '../api';
import type { GroceryItem } from '../../types';

interface GroceryResponse {
  items: GroceryItem[];
  linkedRecipeIds: string[];
}

export const groceryApi = {
  get: () => api.get<GroceryResponse>('/grocery'),
  addItem: (item: { name: string; quantity: number; unit: string; category?: string; recipeId?: string; recipeTitle?: string }) =>
    api.post<GroceryItem>('/grocery/items', item),
  updateItem: (id: string, updates: { quantity?: number; checked?: boolean }) =>
    api.patch<GroceryItem>(`/grocery/items/${id}`, updates),
  deleteItem: (id: string) => api.delete<{ detail: string }>(`/grocery/items/${id}`),
  clearChecked: () => api.delete<{ detail: string }>('/grocery/checked'),
  generate: (recipeIds: string[]) =>
    api.post<GroceryResponse>('/grocery/generate', { recipe_ids: recipeIds }),
};
