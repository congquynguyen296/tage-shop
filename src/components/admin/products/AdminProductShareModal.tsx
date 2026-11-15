"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { money } from "@/config/utils";

interface AdminProductShareModalProps {
  product: Product;
  actionLoading: boolean;
  onSaveShareLink: (
    productId: number | string,
    selectedImages: string[],
    extraTempImages?: string[]
  ) => Promise<{ shareCode: string; shareUrl: string } | null>;
  onClose: () => void;
}

export function AdminProductShareModal({
  product,
  actionLoading,
  onSaveShareLink,
  onClose,
}: AdminProductShareModalProps) {
  const officialImages = product.images || [];
  const [tempImages, setTempImages] = useState<string[]>(
    product.temporaryImages || []
  );
  const [newTempUrl, setNewTempUrl] = useState("");

  const [selectedImages, setSelectedImages] = useState<string[]>(() => {
    if (product.sharedImages && product.sharedImages.length > 0) {
      return product.sharedImages;
    }
    return [...(product.images || []), ...(product.temporaryImages || [])];
  });

  const [savedShareCode, setSavedShareCode] = useState<string | undefined>(
    product.shareCode
  );
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setTempImages(product.temporaryImages || []);
    setSavedShareCode(product.shareCode);
    if (product.sharedImages && product.sharedImages.length > 0) {
      setSelectedImages(product.sharedImages);
    } else {
      setSelectedImages([
        ...(product.images || []),
        ...(product.temporaryImages || []),
      ]);
    }
  }, [product]);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const shareUrl = savedShareCode ? `${origin}/share/${savedShareCode}` : "";

  const toggleImage = (url: string) => {
    setErrorMsg("");
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleSelectAll = () => {
    setErrorMsg("");
    setSelectedImages(Array.from(new Set([...officialImages, ...tempImages])));
  };

  const handleAddQuickTempImage = () => {
    const trimmed = newTempUrl.trim();
    if (!trimmed) return;
    if (!tempImages.includes(trimmed)) {
      setTempImages((prev) => [...prev, trimmed]);
    }
    if (!selectedImages.includes(trimmed)) {
      setSelectedImages((prev) => [...prev, trimmed]);
    }
    setNewTempUrl("");
  };

  const copyToClipboard = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveAndCopy = async () => {
    if (selectedImages.length === 0) {
      setErrorMsg("Select at least 1 photo.");
      return;
    }
    setErrorMsg("");
    const result = await onSaveShareLink(
      product.id,
      selectedImages,
      tempImages
    );
    if (result) {
      setSavedShareCode(result.shareCode);
      await copyToClipboard(result.shareUrl);
    }
  };

  const allPhotosCount = officialImages.length + tempImages.length;

  return (
    <div className="card p-5 border line bg-white space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b line">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h2 className="serif text-xl">{product.name}</h2>
          <span className="text-xs mute font-mono">
            {money(product.price)} · {product.sizes?.join(", ") || "OS"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm mute hover:text-black px-2 py-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Saved Link Bar */}
      {shareUrl && (
        <div className="flex items-center gap-2 bg-neutral-50 p-2.5 border line">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
            className="flex-1 bg-white border line px-3 py-2 text-xs font-mono outline-none select-all"
          />
          <button
            type="button"
            onClick={() => copyToClipboard(shareUrl)}
            className="px-3.5 py-2 bg-black text-white text-xs uppercase tracking-wider hover:opacity-85 shrink-0"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <Link
            href={`/share/${savedShareCode}`}
            target="_blank"
            className="px-3 py-2 border line bg-white hover:border-black text-xs uppercase tracking-wider shrink-0"
          >
            Open ↗
          </Link>
        </div>
      )}

      {/* Photo Selection Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider">
          Photos ({selectedImages.length}/{allPhotosCount})
        </span>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1 border line hover:border-black uppercase tracking-wider"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => setSelectedImages([])}
            className="px-2.5 py-1 border line hover:border-black uppercase tracking-wider mute hover:text-black"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Web Photos */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider mute">
          Web Photos ({officialImages.length})
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
          {officialImages.map((url, idx) => {
            const orderIndex = selectedImages.indexOf(url);
            const isSelected = orderIndex !== -1;
            return (
              <button
                key={`off-${idx}-${url}`}
                type="button"
                onClick={() => toggleImage(url)}
                className={`relative aspect-[3/4] border overflow-hidden transition-all ${
                  isSelected
                    ? "border-black ring-2 ring-black"
                    : "border-neutral-200 opacity-55 hover:opacity-90"
                }`}
              >
                <img
                  src={url}
                  alt={`Web ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/images/products/p1-01.jpg";
                  }}
                />
                {isSelected && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-black text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {orderIndex + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Temp Photos */}
      <div className="space-y-2.5 pt-3 border-t line">
        <div className="text-[11px] uppercase tracking-wider mute">
          Temp Photos ({tempImages.length})
        </div>

        {tempImages.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
            {tempImages.map((url, idx) => {
              const orderIndex = selectedImages.indexOf(url);
              const isSelected = orderIndex !== -1;
              return (
                <button
                  key={`tmp-${idx}-${url}`}
                  type="button"
                  onClick={() => toggleImage(url)}
                  className={`relative aspect-[3/4] border overflow-hidden transition-all ${
                    isSelected
                      ? "border-black ring-2 ring-black"
                      : "border-neutral-200 opacity-55 hover:opacity-90"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Temp ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/images/products/p1-01.jpg";
                    }}
                  />
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-black text-white text-[10px] font-mono font-bold flex items-center justify-center">
                      {orderIndex + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newTempUrl}
            onChange={(e) => setNewTempUrl(e.target.value)}
            placeholder="Add temp image URL..."
            className="flex-1 bg-neutral-50 border line px-3 py-1.5 text-xs outline-none focus:border-black"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddQuickTempImage();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddQuickTempImage}
            className="px-3 py-1.5 border line bg-white hover:border-black text-[11px] uppercase tracking-wider"
          >
            + Add
          </button>
        </div>
      </div>

      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}

      {/* Footer Actions */}
      <div className="flex items-center gap-2.5 pt-3 border-t line">
        <button
          type="button"
          disabled={actionLoading}
          onClick={handleSaveAndCopy}
          className="btn text-xs py-2.5 px-5 disabled:opacity-60"
        >
          {actionLoading
            ? "Saving..."
            : copied
            ? "✓ Link Copied"
            : savedShareCode
            ? "Update & Copy Link"
            : "Create & Copy Link"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border line px-4 py-2.5 text-xs uppercase tracking-wider hover:border-black"
        >
          Close
        </button>
      </div>
    </div>
  );
}
