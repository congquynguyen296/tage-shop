"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@/types";
import { signOut } from "@/lib/auth-client";

interface AdminSidebarProps {
  user: User;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Products & Stock", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Security & 2FA", href: "/admin/security" },
];

export function AdminSidebar({ user, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Continue client cleanup even if network fails
    }
    onLogout();
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 h-screen sticky top-0 border-r line bg-white flex flex-col justify-between shrink-0 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b line flex items-center justify-between">
          <Link href="/admin" aria-label="TAGE Admin">
            <img
              src="/logo/tage_logo.png"
              alt="TAGE"
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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
        <Link
          href="/"
          className="block text-center text-xs tracking-wider uppercase py-2 border line hover:bg-neutral-100 transition-colors"
        >
          ← View Live Shop
        </Link>
        <div className="flex items-center justify-between pt-2 px-1 text-xs">
          <span className="mute truncate max-w-[120px]">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline uppercase text-[11px]"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

