"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Order, OrderStatus } from "@/types";
import { SERVICE_STORAGE_KEYS } from "@/config/routes";

interface OrderStoreState {
  orders: Order[];
  lastPlacedOrder: Order | null;
  lastInstagramMessage: string | null;
  addOrder: (order: Order, instagramMessage?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

export const useOrderStore = create<OrderStoreState>()(
  persist(
    (set) => ({
      orders: [],
      lastPlacedOrder: null,
      lastInstagramMessage: null,
      addOrder: (order, instagramMessage) =>
        set((state) => ({
          orders: [order, ...state.orders],
          lastPlacedOrder: order,
          lastInstagramMessage: instagramMessage || state.lastInstagramMessage,
        })),
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),
    }),
    {
      name: SERVICE_STORAGE_KEYS.ORDERS,
    }
  )
);
