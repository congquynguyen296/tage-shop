"use client";

import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { AdminMetricCards } from "@/components/admin/dashboard/AdminMetricCards";
import { AdminLowStockAlerts } from "@/components/admin/dashboard/AdminLowStockAlerts";

export default function AdminDashboardPage() {
  const { products, lowStockVariants } = useAdminDashboard();
  const soldOutCount = products.filter((p) => p.isSoldOut).length;
  const availableCount = Math.max(0, products.length - soldOutCount);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="serif text-2xl sm:text-3xl font-medium">
          Dashboard Overview
        </h1>
        <p className="mute text-xs mt-1">
          Real-time archive catalog & inventory status
        </p>
      </div>

      {/* Metric Cards */}
      <AdminMetricCards
        catalogCount={products.length}
        availableCount={availableCount}
        soldOutCount={soldOutCount}
        lowStockCount={lowStockVariants.length}
      />

      {/* Inventory & Stock Alerts */}
      <AdminLowStockAlerts variants={lowStockVariants} />
    </div>
  );
}
