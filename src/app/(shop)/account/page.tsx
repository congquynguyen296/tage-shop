"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crumbs } from "@/components/ui/Crumbs";
import { useAuthStore } from "@/service/auth/store";
import { useCartStore } from "@/service/cart/store";
import { useProductStore } from "@/service/products/store";
import { signOut } from "@/lib/auth-client";
import { INSTAGRAM_DM_URL, INSTAGRAM_HANDLE } from "@/config/utils";

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const cartItems = useCartStore((s) => s.items);
  const recentlyViewedIds = useProductStore((s) => s.recentlyViewedIds);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Proceed with local cleanup even if network fails
    }
    logout();
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return (
      <section className="max-w-md mx-auto px-5 py-24 text-center">
        <h1 className="serif text-3xl mb-4">My Account</h1>
        <p className="mute text-sm mb-8">
          Sign in to sync your shopping bag and recently viewed archive pieces across devices.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/login" className="btn">
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="border border-current text-xs tracking-[0.25em] uppercase px-7 py-3.5"
          >
            Create Account
          </Link>
        </div>
      </section>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "ADMIN";

  return (
    <section className="max-w-[1000px] mx-auto px-5 py-16">
      <Crumbs items={[["Home", "/"], ["Account"]]} />

      <div className="flex flex-wrap items-end justify-between gap-4 mt-4 mb-10 pb-6 border-b line">
        <div>
          <h1 className="serif text-4xl">Hello, {user.name}</h1>
          <p className="mute text-sm mt-1">{user.email}</p>
          {isAdmin && (
            <span className="inline-block mt-2 text-[10px] tracking-widest uppercase bg-black text-white px-2 py-0.5">
              Admin Access Granted
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin" className="btn text-xs py-2 px-4">
              Admin Studio →
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="ul text-[11px] tracking-[0.2em] uppercase mute hover:text-[color:var(--fg)]"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="card p-6 rv in flex flex-col justify-between">
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase mb-3">
              Shopping Bag
            </div>
            <p className="mute text-sm mb-6">
              {cartItems.length > 0
                ? `${cartItems.length} unique 1-of-1 piece(s) synced in your bag.`
                : "Your shopping bag is currently empty."}
            </p>
          </div>
          <Link
            href={cartItems.length > 0 ? "/cart" : "/shop"}
            className="ul text-[11px] tracking-[0.2em] uppercase"
          >
            {cartItems.length > 0 ? "View shopping bag →" : "Explore archive →"}
          </Link>
        </div>

        <div className="card p-6 rv in flex flex-col justify-between">
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase mb-3">
              Recently Viewed
            </div>
            <p className="mute text-sm mb-6">
              {recentlyViewedIds.length > 0
                ? `${recentlyViewedIds.length} archive piece(s) in your viewing history.`
                : "Browse the catalog to build your viewing history."}
            </p>
          </div>
          <Link
            href="/shop"
            className="ul text-[11px] tracking-[0.2em] uppercase"
          >
            Browse catalog →
          </Link>
        </div>

        <div className="card p-6 rv in flex flex-col justify-between">
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase mb-3">
              Instagram Concierge
            </div>
            <p className="mute text-sm mb-6">
              Direct ordering and sizing consultation with {INSTAGRAM_HANDLE}.
            </p>
          </div>
          <a
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ul text-[11px] tracking-[0.2em] uppercase"
          >
            Message on Instagram →
          </a>
        </div>
      </div>
    </section>
  );
}
