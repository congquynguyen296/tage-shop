"use client";

import { useMemo } from "react";
import { useOrderStore } from "@/service/orders/store";

export interface CustomerStats {
  name: string;
  email: string;
  orderCount: number;
  totalSpend: number;
  lastOrder: string;
}

export function useAdminCustomers() {
  const orders = useOrderStore((s) => s.orders);

  const customers = useMemo<CustomerStats[]>(() => {
    const customerMap = new Map<string, CustomerStats>();

    for (const o of orders) {
      const existing = customerMap.get(o.customerEmail);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpend += o.total;
      } else {
        customerMap.set(o.customerEmail, {
          name: o.customerName,
          email: o.customerEmail,
          orderCount: 1,
          totalSpend: o.total,
          lastOrder: o.createdAt,
        });
      }
    }

    return Array.from(customerMap.values());
  }, [orders]);

  return {
    customers,
    totalCustomerCount: customers.length,
  };
}

