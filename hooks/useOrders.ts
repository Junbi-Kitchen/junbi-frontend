// Purpose: Hook wrapping orderStore with computed order state helpers

import { useMemo } from 'react';
import { useOrderStore } from '../stores/orderStore';
import type { OrderStatus } from '../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Order Placed',
  preparing: 'Being Prepared',
  ready: 'Ready for Pickup',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled',
};

const STATUS_STEPS: Record<OrderStatus, number> = {
  placed: 0,
  preparing: 1,
  ready: 2,
  picked_up: 3,
  cancelled: -1,
};

export function useOrders() {
  const store = useOrderStore();

  const canPlaceOrder = useMemo(
    () => store.cart.length > 0 && store.selectedStore !== null,
    [store.cart.length, store.selectedStore]
  );

  const orderStatusLabel = useMemo(
    () =>
      store.activeOrder ? STATUS_LABELS[store.activeOrder.status] : null,
    [store.activeOrder]
  );

  const orderStatusStep = useMemo(
    () =>
      store.activeOrder ? STATUS_STEPS[store.activeOrder.status] : -1,
    [store.activeOrder]
  );

  return {
    activeOrder: store.activeOrder,
    history: store.history,
    selectedStore: store.selectedStore,
    cart: store.cart,
    canPlaceOrder,
    orderStatusLabel,
    orderStatusStep,
    selectStore: store.selectStore,
    buildCart: store.buildCart,
    placeOrder: store.placeOrder,
    updateOrderStatus: store.updateOrderStatus,
    completeOrder: store.completeOrder,
  };
}
