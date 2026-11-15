import { create } from "zustand";
import { registerImageErrorNotifier } from "@/config/utils";

export type ProgressState = "idle" | "loading" | "completing";
export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface UiState {
  progressState: ProgressState;
  toasts: ToastItem[];
  startProgress: () => void;
  completeProgress: () => void;
  /**
   * Backward-compatibility alias for startProgress
   */
  triggerProgress: () => void;
  showToast: (
    message: string,
    variant?: ToastVariant,
    durationMs?: number
  ) => void;
  dismissToast: (id: string) => void;
}

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useUiStore = create<UiState>((set, get) => ({
  progressState: "idle",
  toasts: [],
  startProgress: () => {
    set({ progressState: "loading" });
  },
  completeProgress: () => {
    if (get().progressState !== "idle") {
      set({ progressState: "completing" });
    }
  },
  triggerProgress: () => {
    get().startProgress();
  },
  showToast: (message, variant = "success", durationMs = 3000) => {
    const cleanMsg = message.trim();
    if (!cleanMsg) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    set((state) => {
      // Avoid stacking identical consecutive messages
      const filtered = state.toasts.filter((t) => t.message !== cleanMsg);
      return {
        toasts: [...filtered.slice(-2), { id, message: cleanMsg, variant }],
      };
    });

    const timer = setTimeout(() => {
      toastTimers.delete(id);
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, durationMs);

    toastTimers.set(id, timer);
  },
  dismissToast: (id) => {
    const timer = toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

/**
 * Global toast helper that can be called from any hook or store action
 */
export const toast = {
  success: (message: string, durationMs?: number) =>
    useUiStore.getState().showToast(message, "success", durationMs),
  error: (message: string, durationMs?: number) =>
    useUiStore.getState().showToast(message, "error", durationMs),
  info: (message: string, durationMs?: number) =>
    useUiStore.getState().showToast(message, "info", durationMs),
};

registerImageErrorNotifier((msg) => {
  toast.error(msg);
});
