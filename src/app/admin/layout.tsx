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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          if (Array.isArray(items)) {
            setProducts(items);
          }
        })
        .catch(() => {});
    }
  }, [mounted, isAdmin, setProducts]);

  if (!mounted || isPending || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-xs tracking-widest uppercase mute px-4 text-center">
        <span className="w-5 h-5 border-2 border-neutral-800 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-[#f4f4f4] text-[#111]">
      <AdminSidebar
        user={user}
        onLogout={logout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 sm:h-16 shrink-0 bg-white border-b line flex items-center justify-between px-4 sm:px-6 md:px-8 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden w-9 h-9 border line flex items-center justify-center hover:bg-neutral-100 shrink-0"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="text-[11px] sm:text-xs tracking-widest uppercase mute truncate">
              Admin Management Console
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">TAGE Backend Engine Active</span>
            <span className="sm:hidden">Active</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden page">
          {children}
        </main>
      </div>
    </div>
  );
}
