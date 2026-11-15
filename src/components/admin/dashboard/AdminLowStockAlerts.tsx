import Link from "next/link";
import { LowStockVariantInfo } from "@/hooks/useAdminDashboard";

interface AdminLowStockAlertsProps {
  variants: LowStockVariantInfo[];
}

export function AdminLowStockAlerts({ variants }: AdminLowStockAlertsProps) {
  return (
    <div className="card border line bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs tracking-widest uppercase font-semibold">
          Low Stock Warnings
        </h2>
        <Link href="/admin/products" className="text-xs mute hover:text-black underline">
          Manage stock →
        </Link>
      </div>

      {variants.length === 0 ? (
        <p className="mute text-xs py-8 text-center">
          All variants have healthy inventory levels.
        </p>
      ) : (
        <div className="divide-y line">
          {variants.slice(0, 5).map((v) => (
            <div
              key={v.id}
              className="py-3 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold">{v.productName}</div>
                <div className="mute text-[11px]">
                  Size: {v.size} · SKU: {v.sku}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-semibold px-2 py-0.5 text-[11px] ${
                    v.stock === 0
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {v.stock === 0 ? "Out of Stock" : `${v.stock} left`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

