import { api } from '../api';
import type { Order } from '../../types';

interface OrdersHistoryResponse {
  orders: Order[];
  next_cursor: string | null;
}

export const ordersApi = {
  getActive: () => api.get<Order | null>('/orders/active'),
  getHistory: (params?: { cursor?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<OrdersHistoryResponse>(`/orders/history${qs ? `?${qs}` : ''}`);
  },
  place: (storeId: string, items: Array<{ name: string; quantity: number; unit: string }>) =>
    api.post<Order>('/orders', { store_id: storeId, items }),
  updateStatus: (id: string, status: string) =>
    api.patch<Order>(`/orders/${id}/status`, { status }),
};
