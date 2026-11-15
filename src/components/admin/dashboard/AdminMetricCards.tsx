import { money } from "@/config/utils";

interface AdminMetricCardsProps {
  totalRevenue: number;
  totalOrders: number;
  catalogCount: number;
  lowStockCount: number;
}

export function AdminMetricCards({
  totalRevenue,
  totalOrders,
  catalogCount,
  lowStockCount,
}: AdminMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="card p-6 border line bg-white">
        <div className="text-[11px] tracking-widest uppercase mute mb-2">
          Total Revenue
        </div>
        <div className="serif text-3xl">{money(totalRevenue)}</div>
        <div className="text-xs text-emerald-600 mt-2">
          From {totalOrders} orders
        </div>
      </div>

      <div className="card p-6 border line bg-white">
        <div className="text-[11px] tracking-widest uppercase mute mb-2">
          Total Orders
        </div>
        <div className="serif text-3xl">{totalOrders}</div>
        <div className="text-xs mute mt-2">Instagram Orders synced</div>
      </div>

      <div className="card p-6 border line bg-white">
        <div className="text-[11px] tracking-widest uppercase mute mb-2">
          Active Catalog
        </div>
        <div className="serif text-3xl">{catalogCount}</div>
        <div className="text-xs mute mt-2">Products in FW26</div>
      </div>

      <div className="card p-6 border line bg-white">
        <div className="text-[11px] tracking-widest uppercase mute mb-2">
          Low Stock Alerts
        </div>
        <div
          className={`serif text-3xl ${
            lowStockCount ? "text-amber-600" : ""
          }`}
        >
          {lowStockCount}
        </div>
        <div className="text-xs mute mt-2">Variants with stock ≤ 3</div>
      </div>
    </div>
  );
}

