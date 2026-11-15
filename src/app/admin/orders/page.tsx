"use client";

import { useAdminOrders } from "@/hooks/useAdminOrders";
import { AdminOrdersHeader } from "@/components/admin/orders/AdminOrdersHeader";
import { AdminOrdersTable } from "@/components/admin/orders/AdminOrdersTable";

export default function AdminOrdersPage() {
  const { orders, loadingOrderId, statusMessage, handleStatusChange } =
    useAdminOrders();

  return (
    <div className="space-y-8">
      {/* Header and Status Message Alert */}
      <AdminOrdersHeader
        statusMessage={statusMessage}
        isLoading={Boolean(loadingOrderId)}
      />

      {/* Orders Table */}
      <AdminOrdersTable
        orders={orders}
        loadingOrderId={loadingOrderId}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
