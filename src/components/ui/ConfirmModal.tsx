"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border line shadow-2xl p-6 space-y-5 page"
      >
        <div className="flex items-start justify-between gap-3 border-b line pb-3">
          <h3
            id="confirm-modal-title"
            className="text-xs tracking-widest uppercase font-semibold"
          >
            {title}
          </h3>
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            aria-label="Close modal"
            className="text-xs mute hover:text-black disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <p className="text-xs leading-relaxed text-neutral-700">{message}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t line">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2.5 border line bg-white hover:border-black text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-xs uppercase tracking-wider font-medium transition-colors disabled:opacity-60 ${
              isDanger
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-black text-white hover:opacity-85"
            }`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
