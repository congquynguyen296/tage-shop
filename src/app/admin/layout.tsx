"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/service/auth/store";
import { useProductStore } from "@/service/products/store";
import { getAdminProductsAction } from "@/service/products/actions";
import { useAuthSync } from "@/hooks/useAuthSync";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isPending } = useAuthSync();
  const logout = useAuthStore((s) => s.logout);
  const setProducts = useProductStore((s) => s.setProducts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = user?.role === "ADMIN" || user?.role === "admin";

  useEffect(() => {
    if (mounted && !isPending && !isAdmin) {
      router.push("/auth/login?redirect=/admin&reason=admin_required");
    }
  }, [mounted, isPending, isAdmin, router]);

  useEffect(() => {
    if (mounted && isAdmin) {
      getAdminProductsAction()
        .then((items) => {
          if (Array.isArray(items) && items.length > 0) {
            setProducts(items);
          }
        })
        .catch(() => {});
    }
  }, [mounted, isAdmin, setProducts]);

  if (!mounted || isPending || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs tracking-widest uppercase mute">
        Checking Admin Permissions...
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-[#f4f4f4] text-[#111]">
      <AdminSidebar user={user} onLogout={logout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 shrink-0 bg-white border-b line flex items-center justify-between px-8">
          <div className="text-xs tracking-widest uppercase mute">
            Admin Management Console
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>TAGE Backend Engine Active</span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto page">{children}</main>
      </div>
    </div>
  );
}
