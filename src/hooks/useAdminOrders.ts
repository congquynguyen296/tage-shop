"use client";

import { useState } from "react";
import { useOrderStore } from "@/service/orders/store";
import { OrderStatus } from "@/types";
import { updateOrderStatusAction } from "@/service/orders/actions";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
];

export function useAdminOrders() {
  const orders = useOrderStore((s) => s.orders);
  const updateOrderStatus = useOrderStore((s) => s.updateOrderStatus);

  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setLoadingOrderId(orderId);
    setStatusMessage(`Updating order ${orderId} to ${newStatus}...`);

    try {
      await updateOrderStatusAction(orderId, newStatus, () => {
        updateOrderStatus(orderId, newStatus);
      });
      setStatusMessage("Order status updated!");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch {
      setStatusMessage("Failed to update status");
    } finally {
      setLoadingOrderId(null);
    }
  };

  return {
    orders,
    loadingOrderId,
    statusMessage,
    handleStatusChange,
  };
}

export type UseAdminOrdersReturn = ReturnType<typeof useAdminOrders>;

