import Link from "next/link";
import { Order } from "@/types";
import { money } from "@/config/utils";

interface AdminRecentOrdersProps {
  orders: Order[];
}

export function AdminRecentOrders({ orders }: AdminRecentOrdersProps) {
  return (
    <div className="card border line bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs tracking-widest uppercase font-semibold">
          Recent Orders
        </h2>
        <Link href="/admin/orders" className="text-xs mute hover:text-black underline">
          View all →
        </Link>
      </div>

      <div className="divide-y line">
        {orders.length === 0 ? (
          <p className="mute text-xs py-8 text-center">No orders placed yet.</p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="py-3 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold">{o.orderNumber}</div>
                <div className="mute">
                  {o.customerName} ({o.items.length} items)
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{money(o.total)}</div>
                <span className="text-[10px] tracking-wider uppercase px-2 py-0.5 bg-neutral-100">
                  {o.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

