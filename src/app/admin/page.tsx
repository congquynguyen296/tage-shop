"use client";

import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { AdminMetricCards } from "@/components/admin/dashboard/AdminMetricCards";
import { AdminRecentOrders } from "@/components/admin/dashboard/AdminRecentOrders";
import { AdminLowStockAlerts } from "@/components/admin/dashboard/AdminLowStockAlerts";

export default function AdminDashboardPage() {
  const { products, orders, totalRevenue, lowStockVariants, recentOrders } =
    useAdminDashboard();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="serif text-3xl font-medium">Dashboard Overview</h1>
        <p className="mute text-xs mt-1">
          Real-time store performance & operational health
        </p>
      </div>

      {/* Metric Cards */}
      <AdminMetricCards
        totalRevenue={totalRevenue}
        totalOrders={orders.length}
        catalogCount={products.length}
        lowStockCount={lowStockVariants.length}
      />

      {/* Recent Activity: Orders & Stock Alerts */}
      <div className="grid lg:grid-cols-2 gap-8">
        <AdminRecentOrders orders={recentOrders} />
        <AdminLowStockAlerts variants={lowStockVariants} />
      </div>
    </div>
  );
}
