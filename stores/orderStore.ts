// Purpose: Zustand store managing pickup orders, cart, and store selection

import { create } from 'zustand';
import type { Order, Store, GroceryItem, OrderStatus } from '../types';
import { MOCK_ORDER, MOCK_STORES } from '../lib/mockData';

interface OrderStore {
  activeOrder: Order | null;
  history: Order[];
  selectedStore: Store | null;
  cart: GroceryItem[];
  selectStore: (store: Store) => void;
  buildCart: (items: GroceryItem[]) => void;
  placeOrder: () => void;
  updateOrderStatus: (status: OrderStatus) => void;
  completeOrder: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  activeOrder: MOCK_ORDER,
  history: [],
  selectedStore: MOCK_STORES[0],
  cart: [],

  selectStore: (store) => {
    set({ selectedStore: store });
  },

  buildCart: (items) => {
    set({ cart: items.filter((i) => !i.checked) });
  },

  placeOrder: () => {
    const { cart, selectedStore } = get();
    if (!selectedStore || cart.length === 0) return;

    const order: Order = {
      id: `o-${Date.now()}`,
      store: selectedStore,
      items: cart,
      status: 'placed',
      estimatedPickup: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      subtotal: cart.length * 4.99,
      placedAt: new Date().toISOString(),
    };

    set((state) => ({
      activeOrder: order,
      history: state.activeOrder
        ? [state.activeOrder, ...state.history]
        : state.history,
      cart: [],
    }));
  },

  updateOrderStatus: (status) => {
    set((state) => ({
      activeOrder: state.activeOrder
        ? { ...state.activeOrder, status }
        : null,
    }));
  },

  completeOrder: () => {
    set((state) => ({
      history: state.activeOrder
        ? [{ ...state.activeOrder, status: 'picked_up' as OrderStatus }, ...state.history]
        : state.history,
      activeOrder: null,
    }));
  },
}));
