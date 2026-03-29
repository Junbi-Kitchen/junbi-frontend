// Purpose: Zustand store managing pickup orders, cart, and store selection

import { create } from 'zustand';
import type { Order, Store, GroceryItem, OrderStatus } from '../types';
import { ordersApi } from '../lib/api/orders';
import { storesApi } from '../lib/api/stores';

interface OrderStore {
  activeOrder: Order | null;
  history: Order[];
  stores: Store[];
  selectedStore: Store | null;
  cart: GroceryItem[];
  isLoading: boolean;
  fetchStores: () => Promise<void>;
  fetchActiveOrder: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  selectStore: (store: Store) => void;
  buildCart: (items: GroceryItem[]) => void;
  placeOrder: () => Promise<void>;
  updateOrderStatus: (status: OrderStatus) => void;
  completeOrder: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  activeOrder: null,
  history: [],
  stores: [],
  selectedStore: null,
  cart: [],
  isLoading: false,

  fetchStores: async () => {
    const stores = await storesApi.getAll();
    set({ stores, selectedStore: stores[0] ?? null });
  },

  fetchActiveOrder: async () => {
    set({ isLoading: true });
    try {
      const order = await ordersApi.getActive();
      set({ activeOrder: order });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async () => {
    const data = await ordersApi.getHistory({ limit: 20 });
    set({ history: data.orders });
  },

  selectStore: (store) => {
    set({ selectedStore: store });
  },

  buildCart: (items) => {
    set({ cart: items.filter((i) => !i.checked) });
  },

  placeOrder: async () => {
    const { cart, selectedStore, activeOrder, history } = get();
    if (!selectedStore || cart.length === 0) return;

    const order = await ordersApi.place(
      selectedStore.id,
      cart.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit }))
    );

    set({
      activeOrder: order,
      history: activeOrder ? [activeOrder, ...history] : history,
      cart: [],
    });
  },

  updateOrderStatus: (status) => {
    set((state) => ({
      activeOrder: state.activeOrder ? { ...state.activeOrder, status } : null,
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
