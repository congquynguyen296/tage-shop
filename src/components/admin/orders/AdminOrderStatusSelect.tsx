import { OrderStatus } from "@/types";
import { ORDER_STATUSES } from "@/hooks/useAdminOrders";

interface AdminOrderStatusSelectProps {
  currentStatus: OrderStatus;
  orderId: string;
  isLoading: boolean;
  onStatusChange: (orderId: string, nextStatus: OrderStatus) => void;
}

export function AdminOrderStatusSelect({
  currentStatus,
  orderId,
  isLoading,
  onStatusChange,
}: AdminOrderStatusSelectProps) {
  return (
    <select
      value={currentStatus}
      disabled={isLoading}
      onChange={(e) => onStatusChange(orderId, e.target.value as OrderStatus)}
      className={`px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase border line outline-none cursor-pointer disabled:opacity-50 ${
        currentStatus === "COMPLETED"
          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
          : currentStatus === "PAID"
          ? "bg-green-50 text-green-800 border-green-300"
          : currentStatus === "SHIPPING"
          ? "bg-blue-50 text-blue-800 border-blue-300"
          : currentStatus === "CANCELLED"
          ? "bg-red-50 text-red-800 border-red-300"
          : "bg-neutral-50 text-neutral-800 border-neutral-300"
      }`}
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

