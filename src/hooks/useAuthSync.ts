"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useAuthStore } from "@/service/auth/store";
import { useCartStore } from "@/service/cart/store";
import { useProductStore } from "@/service/products/store";
import { trackRecentlyViewedApi } from "@/service/products/queries";

/**
 * Module-scoped sync trackers so React StrictMode double-mounts or layout
 * transitions do not trigger duplicate `/api/cart` or `/api/recently-viewed` requests.
 */
let lastSyncedUserId: string | null = null;
let hasSyncedGuestCart = false;

export function markUserSessionSynced(userId: string) {
  lastSyncedUserId = userId;
}

/**
 * Synchronizes Better Auth's live session (short-lived signed cookie cache
 * + DB refresh token rotation) with client-side Zustand stores:
 * - useAuthStore (user profile & role)
 * - useCartStore (merges guest cart to DB & hydrates user cart)
 * - RecentlyViewed (merges guest recently viewed to DB)
 */
export function useAuthSync() {
  const { data: sessionData, isPending } = useSession();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (isPending) return;

    const sessionUser = sessionData?.user as
      | { id: string; name: string; email: string; role?: string | null }
      | undefined;

    if (sessionUser) {
      const normalizedRole =
        sessionUser.role?.toLowerCase() === "admin" ? "admin" : "user";

      if (
        !user ||
        user.id !== sessionUser.id ||
        user.role !== normalizedRole ||
        user.name !== sessionUser.name
      ) {
        setUser({
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          role: normalizedRole,
          addresses: user?.addresses || [],
        });
      }

      if (lastSyncedUserId !== sessionUser.id) {
        lastSyncedUserId = sessionUser.id;
        // 1. Sync & merge guest cart with PostgreSQL cart_items
        useCartStore.getState().syncWithServer(true);

        // 2. Sync guest recently viewed items to PostgreSQL recently_viewed_items
        const guestRecentIds = useProductStore.getState().recentlyViewedIds;
        if (guestRecentIds.length > 0) {
          trackRecentlyViewedApi(undefined, guestRecentIds);
        }
      }
    } else {
      // No active session on server
      lastSyncedUserId = null;
      if (user) {
        logout();
      }
      if (!hasSyncedGuestCart) {
        hasSyncedGuestCart = true;
        useCartStore.getState().syncWithServer(false);
      }
    }
  }, [sessionData, isPending, user, setUser, logout]);

  return { sessionData, isPending, user };
}
