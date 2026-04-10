import { api } from '../api';
import type { PantryItem } from '../../types';

type AddItemInput = Pick<PantryItem, 'name' | 'quantity' | 'unit' | 'category'> & {
  expiryDate?: string | null;
  addedVia?: string;
};

export const pantryApi = {
  getAll: () => api.get<PantryItem[]>('/pantry'),
  add: (item: AddItemInput) => api.post<PantryItem>('/pantry', item),
  update: (id: string, updates: Partial<AddItemInput>) =>
    api.patch<PantryItem>(`/pantry/${id}`, updates),
  remove: (id: string) => api.delete<{ detail: string }>(`/pantry/${id}`),
  logAction: (id: string, action: 'used' | 'tossed', estimatedValue = 0) =>
    api.post<{ action: string; estimatedValue: number }>(`/pantry/${id}/log-action`, {
      action,
      estimatedValue,
    }),
  bulkAdd: (items: AddItemInput[]) => api.post<PantryItem[]>('/pantry/bulk', { items }),
};
