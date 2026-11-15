"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/types";
import { STOREFRONT_LOCKED } from "@/config/routes";
import { signOut } from "@/lib/auth-client";

interface AdminSidebarProps {
  user: User;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products & Stock", href: "/admin/products" },
  // { label: "Orders", href: "/admin/orders" }, // Hidden while storefront orders are paused
  { label: "Customers", href: "/admin/customers" },
  { label: "Security & 2FA", href: "/admin/security" },
];

export function AdminSidebar({
  user,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Continue client cleanup even if network fails
    }
    onLogout();
    onCloseMobile?.();
    router.push("/auth/login");
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white">
      <div>
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b line flex items-center justify-between">
          <Link
            href="/admin"
            aria-label="TAGE Admin"
            onClick={() => onCloseMobile?.()}
          >
            <img
              src="/logo/tage_logo.png"
              alt="TAGE"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="md:hidden w-8 h-8 flex items-center justify-center text-sm mute hover:text-black"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 sm:p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onCloseMobile?.()}
                className={`block px-4 py-2.5 text-xs tracking-wider uppercase transition-colors rounded-sm ${
                  active
                    ? "bg-black text-white font-medium"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & User Session Controls */}
      <div className="p-4 border-t line space-y-2">
        {STOREFRONT_LOCKED ? (
          <div className="block text-center text-[11px] tracking-wider uppercase py-2 border line bg-neutral-50 mute select-none">
            Web Storefront Locked
          </div>
        ) : (
          <Link
            href="/"
            onClick={() => onCloseMobile?.()}
            className="block text-center text-xs tracking-wider uppercase py-2 border line hover:bg-neutral-100 transition-colors"
          >
            ← View Live Shop
          </Link>
        )}
        <div className="flex items-center justify-between pt-2 px-1 text-xs">
          <span className="mute truncate max-w-[140px]">{user.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-red-600 hover:underline uppercase text-[11px] shrink-0"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 border-r line bg-white flex-col justify-between shrink-0 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full border-r line bg-white overflow-y-auto shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
