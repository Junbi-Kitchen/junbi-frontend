import { api } from '../api';
import type { PantryItem, ScanResponse } from '../../types';

type AddItemInput = Pick<PantryItem, 'name' | 'quantity' | 'unit' | 'category'> & {
  expiryDate?: string | null;
  addedVia?: string;
};

export const pantryApi = {
  searchIngredients: (q: string) =>
    api.get<{ name: string; category: string }[]>(`/pantry/ingredients/search?q=${encodeURIComponent(q)}`),
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
  scanReceipt: async (base64: string, mimeType = 'image/jpeg'): Promise<ScanResponse> => {
    const blob = await (await fetch(`data:${mimeType};base64,${base64}`)).blob();
    const form = new FormData();
    form.append('image', blob, `receipt.${mimeType.split('/')[1]}`);
    return api.upload<ScanResponse>('/pantry/ocr', form);
  },
};
