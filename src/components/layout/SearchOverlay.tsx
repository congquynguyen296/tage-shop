"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";
import { SearchProductRowSkeleton } from "@/components/product/ProductSkeleton";
import { money, getSafeProductImage } from "@/config/utils";
import { useProductStore } from "@/service/products/store";
import { searchProductsApi } from "@/service/products/queries";
import { Product } from "@/types";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const POPULAR_TERMS = ["Denim", "Jacket", "Leather", "Boot", "Knit", "Dress", "Shirt"];

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upsertProductsToCache = useProductStore((s) => s.upsertProductsToCache);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Call live PostgreSQL search API with 300ms debounce
  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      searchProductsApi(trimmed)
        .then((res) => {
          if (!cancelled) {
            setResults(res.data);
            if (res.data.length > 0) {
              upsertProductsToCache(res.data);
            }
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, upsertProductsToCache]);

  const handleClose = () => {
    onClose();
    setQ("");
    setResults([]);
  };

  const trimmed = q.trim();

  return (
    <>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-[80] bg-black/30"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .4s",
        }}
      />
      <div
        className="fixed top-0 inset-x-0 z-[81] border-b line"
        style={{
          background: "var(--bg)",
          paddingTop: "env(safe-area-inset-top,0px)",
          transform: open ? "none" : "translateY(-100%)",
          transition: "transform .55s cubic-bezier(.7,0,.2,1)",
          visibility: open ? "visible" : "hidden",
          transitionProperty: "transform,visibility",
          transitionDelay: open ? "0s" : "0s,.55s",
        }}
      >
        <div className="max-w-[900px] mx-auto px-5 py-8">
          <div className="flex items-center gap-4 border-b border-current pb-3">
            {Icons.search}
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search TAGE products..."
              className="flex-1 bg-transparent outline-none text-xl"
            />
            {loading && (
              <span className="text-[11px] tracking-[0.2em] uppercase mute animate-pulse">
                Searching...
              </span>
            )}
            <button onClick={handleClose} aria-label="Close" className="text-lg">
              ✕
            </button>
          </div>
          <div className="mt-6 max-h-[60vh] overflow-y-auto">
            {!trimmed && (
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase mute mb-4">
                  Popular searches
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                  {POPULAR_TERMS.map((w) => (
                    <button key={w} onClick={() => setQ(w)} className="ul">
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {trimmed && loading && <SearchProductRowSkeleton count={4} />}

            {trimmed && !loading && results.length === 0 && (
              <p className="mute text-sm py-6">No results for “{q}”.</p>
            )}

            {!loading &&
              results.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  onClick={handleClose}
                  className="flex items-center gap-4 py-3 border-b line hover:bg-[color:var(--card)]/50 px-2 transition-colors"
                >
                  <div
                    className="w-14 shrink-0 relative overflow-hidden card"
                    style={{ aspectRatio: "3/4" }}
                  >
                    <img
                      src={getSafeProductImage(p)}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/images/products/p1-01.jpg";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs tracking-wide">{p.name}</div>
                    <div className="mute text-xs mt-0.5">
                      {p.category}
                    </div>
                  </div>
                  <div className="text-sm">{money(p.price)}</div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}

