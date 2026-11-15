"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/types";
import { AddToCartSchema } from "./schema";
import { fetchCartApi } from "./queries";
import {
  addToCartApi,
  clearCartApi,
  removeFromCartApi,
  syncCartWithBackend,
} from "./actions";

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountRate: number; // e.g. 0.1 for 10%
  toastMessage: string;
  isSyncing: boolean;
  flashToast: (msg: string) => void;
  setItems: (items: CartItem[]) => void;
  addItem: (product: Product, size: string | null, qty?: number) => boolean;
  updateQty: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  mergeWithServerCart: (serverItems: CartItem[]) => void;
  syncWithServer: (isLoggedIn: boolean) => Promise<void>;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountRate: 0,
      toastMessage: "",
      isSyncing: false,

      flashToast: (msg: string) => {
        if (toastTimer) clearTimeout(toastTimer);
        set({ toastMessage: msg });
        toastTimer = setTimeout(() => {
          set({ toastMessage: "" });
        }, 2200);
      },

      setItems: (items) => set({ items }),

      addItem: (product, size) => {
        const resolvedSize =
          size ||
          product.sizes?.[0] ||
          product.variants?.[0]?.size ||
          "One Size";

        // 1-of-1 Archive Piece Rule: Check if already in bag
        const alreadyInBag = get().items.some(
          (i) =>
            String(i.product.id) === String(product.id) ||
            i.product.slug === product.slug
        );

        if (alreadyInBag) {
          get().flashToast("This unique piece is already in your bag");
          return false;
        }

        const parsed = AddToCartSchema.safeParse({
          productId: product.id,
          size: resolvedSize,
          color: product.color || "Standard",
          qty: 1,
        });

        if (!parsed.success) {
          get().flashToast(parsed.error.issues[0]?.message || "Invalid item");
          return false;
        }

        // Check availability
        const variant = product.variants?.find((v) => v.size === resolvedSize);
        if (product.isSoldOut || (variant && variant.stock <= 0)) {
          get().flashToast("This piece is currently sold out");
          return false;
        }

        const key = `${product.id}-${resolvedSize}`;
        const newItem: CartItem = {
          key,
          product,
          size: resolvedSize,
          color: product.color || "Standard",
          qty: 1, // Strictly 1 for 1-of-1 second-hand domain
        };

        // Optimistic update on client store
        set((state) => ({
          items: [newItem, ...state.items],
        }));

        get().flashToast("Added to bag");

        // Sync with PostgreSQL backend asynchronously
        addToCartApi(product.slug || product.id)
          .then((res) => {
            if (!res.success) {
              // Rollback if item was sold out in DB concurrently
              set((state) => ({
                items: state.items.filter((i) => i.key !== key),
              }));
              get().flashToast(res.message || "Piece is no longer available");
            } else if (res.data) {
              // Update item with canonical DB ID/slug
              set((state) => ({
                items: state.items.map((i) => (i.key === key ? res.data : i)),
              }));
            }
          })
          .catch(() => {
            // Keep optimistic local cart item if offline
          });

        return true;
      },

      updateQty: () => {
        // No-op: Every archive item is a 1-of-1 piece (quantity is fixed to 1)
      },

      removeItem: (key) => {
        const target = get().items.find((i) => i.key === key);
        set((state) => ({
          items: state.items.filter((i) => i.key !== key),
        }));

        if (target) {
          removeFromCartApi(target.product.slug || target.product.id).catch(
            () => {}
          );
        }
      },

      clearCart: () => {
        set({ items: [], couponCode: null, discountRate: 0 });
        clearCartApi().catch(() => {});
      },

      applyCoupon: (code) => {
        const clean = code.trim().toUpperCase();
        if (clean === "TAGE10") {
          set({ couponCode: "TAGE10", discountRate: 0.1 });
          get().flashToast("Promo code TAGE10 (10% off) applied");
          return { ok: true, message: "10% discount applied" };
        }
        return { ok: false, message: "Invalid or expired promo code" };
      },

      mergeWithServerCart: (serverItems) => {
        set((state) => {
          const map = new Map<string, CartItem>();
          for (const item of serverItems) {
            map.set(item.product.slug, { ...item, qty: 1 });
          }
          for (const local of state.items) {
            if (!map.has(local.product.slug)) {
              map.set(local.product.slug, { ...local, qty: 1 });
            }
          }
          return { items: Array.from(map.values()) };
        });
      },

      syncWithServer: async (isLoggedIn: boolean) => {
        set({ isSyncing: true });
        try {
          const currentItems = get().items;
          if (isLoggedIn) {
            // If user has local guest items, merge them via POST /api/cart; otherwise just GET /api/cart
            const res =
              currentItems.length > 0
                ? await syncCartWithBackend(currentItems)
                : await fetchCartApi();
            if (res.success && Array.isArray(res.data)) {
              set({ items: res.data });
            }
          } else if (currentItems.length > 0) {
            const keys = currentItems.map(
              (i) => i.product.slug || String(i.product.id)
            );
            const res = await fetchCartApi(keys);
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
              set({ items: res.data });
            }
          }
        } catch {
          // Retain local cart if offline
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "tage-cart-storage",
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountRate: state.discountRate,
      }),
    }
  )
);
