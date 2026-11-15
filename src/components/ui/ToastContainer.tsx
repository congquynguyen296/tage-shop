"use client";

import { useUiStore } from "@/service/ui/store";

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[110] flex flex-col gap-2.5 max-w-[calc(100vw-2.5rem)] sm:max-w-sm pointer-events-none"
    >
      {toasts.map((t) => {
        const isError = t.variant === "error";
        const isInfo = t.variant === "info";

        return (
          <div
            key={t.id}
            role="status"
            className={`toast pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 border shadow-lg text-xs tracking-wider uppercase transition-all ${
              isError
                ? "bg-red-600 text-white border-red-700"
                : isInfo
                ? "bg-white text-black border-black"
                : "bg-neutral-900 text-white border-black"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                  isError
                    ? "bg-white text-red-600"
                    : isInfo
                    ? "bg-black text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {isError ? "!" : isInfo ? "i" : "✓"}
              </span>
              <span className="truncate font-medium">{t.message}</span>
            </div>

            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Close notification"
              className="opacity-70 hover:opacity-100 text-xs px-1 shrink-0"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
