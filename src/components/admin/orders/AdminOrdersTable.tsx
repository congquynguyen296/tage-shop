import { Order, OrderStatus } from "@/types";
import { money } from "@/config/utils";
import { AdminOrderStatusSelect } from "./AdminOrderStatusSelect";

interface AdminOrdersTableProps {
  orders: Order[];
  loadingOrderId: string | null;
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => void;
}

export function AdminOrdersTable({
  orders,
  loadingOrderId,
  onStatusChange,
}: AdminOrdersTableProps) {
  return (
    <div className="card border line bg-white overflow-hidden">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b line bg-neutral-50 tracking-wider uppercase text-[11px] mute">
            <th className="p-4">Order #</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Items</th>
            <th className="p-4">Total</th>
            <th className="p-4">Payment & Method</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y line">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-neutral-50/70 transition-colors">
              <td className="p-4 font-semibold">{o.orderNumber}</td>
              <td className="p-4">
                <div className="font-medium">{o.customerName}</div>
                <div className="mute text-[11px]">{o.customerEmail}</div>
                <div className="mute text-[10px]">
                  {o.shippingAddress.city}, {o.shippingAddress.country}
                </div>
              </td>
              <td className="p-4">
                <div className="space-y-1">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="mute text-[11px]">
                      • {i.productName} ({i.size}) × {i.qty}
                    </div>
                  ))}
                </div>
              </td>
              <td className="p-4 font-medium">{money(o.total)}</td>
              <td className="p-4">
                <span className="uppercase text-[11px] tracking-wider block">
                  {o.paymentMethod}
                </span>
                <span className="mute text-[10px]">
                  {o.deliveryMethod === "exp"
                    ? "Express Delivery"
                    : "Standard Delivery"}
                </span>
              </td>
              <td className="p-4">
                <AdminOrderStatusSelect
                  currentStatus={o.status}
                  orderId={o.id}
                  isLoading={loadingOrderId === o.id}
                  onStatusChange={onStatusChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

