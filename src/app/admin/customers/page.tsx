"use client";

import { useAdminCustomers } from "@/hooks/useAdminCustomers";
import { AdminCustomersHeader } from "@/components/admin/customers/AdminCustomersHeader";
import { AdminCustomersTable } from "@/components/admin/customers/AdminCustomersTable";

export default function AdminCustomersPage() {
  const { customers } = useAdminCustomers();

  return (
    <div className="space-y-8">
      <AdminCustomersHeader />
      <AdminCustomersTable customers={customers} />
    </div>
  );
}
