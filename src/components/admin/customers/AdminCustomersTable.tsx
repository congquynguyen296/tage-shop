import { CustomerStats } from "@/hooks/useAdminCustomers";
import { money } from "@/config/utils";

interface AdminCustomersTableProps {
  customers: CustomerStats[];
}

export function AdminCustomersTable({ customers }: AdminCustomersTableProps) {
  return (
    <div className="card border line bg-white overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs border-collapse">
        <thead>
          <tr className="border-b line bg-neutral-50 tracking-wider uppercase text-[11px] mute">
            <th className="p-4">Customer Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Total Orders</th>
            <th className="p-4">Lifetime Spend</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y line">
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center mute">
                No customer data available yet.
              </td>
            </tr>
          ) : (
            customers.map((c) => (
              <tr
                key={c.email}
                className="hover:bg-neutral-50/70 transition-colors"
              >
                <td className="p-4 font-semibold">{c.name}</td>
                <td className="p-4 mute">{c.email}</td>
                <td className="p-4">{c.orderCount} order(s)</td>
                <td className="p-4 font-medium">{money(c.totalSpend)}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 text-[10px] tracking-widest uppercase bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

