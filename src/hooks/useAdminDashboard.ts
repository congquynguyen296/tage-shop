"use client";

import { useMemo } from "react";
import { useProductStore } from "@/service/products/store";
import { useOrderStore } from "@/service/orders/store";

export interface LowStockVariantInfo {
  id: string;
  sku: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  productName: string;
}

export function useAdminDashboard() {
  const products = useProductStore((s) => s.products);
  const orders = useOrderStore((s) => s.orders);

  const totalRevenue = useMemo(
    () => orders.reduce((acc, o) => acc + o.total, 0),
    [orders]
  );

  const lowStockVariants = useMemo<LowStockVariantInfo[]>(() => {
    return products.flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= 3)
        .map((v) => ({ ...v, productName: p.name }))
    );
  }, [products]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return {
    products,
    orders,
    totalRevenue,
    lowStockVariants,
    recentOrders,
  };
}

