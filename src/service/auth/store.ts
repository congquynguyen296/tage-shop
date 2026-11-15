"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Address, User } from "@/types";
import { AUTH_CONFIG } from "@/config/auth";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  removeAddress: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => {
        set({ user });
      },

      addAddress: (addr) =>
        set((state) => {
          if (!state.user) return state;
          const newAddr: Address = {
            ...addr,
            id: `addr-${Date.now()}`,
          };
          const current = state.user.addresses || [];
          return {
            user: {
              ...state.user,
              addresses: [newAddr, ...current],
            },
          };
        }),

      removeAddress: (id) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              addresses: (state.user.addresses || []).filter(
                (a) => a.id !== id
              ),
            },
          };
        }),

      logout: () => {
        set({ user: null });
      },
    }),
    {
      name: AUTH_CONFIG.tokenStorageKey,
    }
  )
);
