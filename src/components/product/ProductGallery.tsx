"use client";

import { Product } from "@/types";
import { getSafeProductImage, handleProductImageError } from "@/config/utils";

interface ProductGalleryProps {
  product: Product;
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onOpenZoom: () => void;
}

export function ProductGallery({
  product,
  activeIndex,
  onSelectIndex,
  onOpenZoom,
}: ProductGalleryProps) {
  return (
    <div className="grid md:grid-cols-[80px_1fr] gap-4">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-3 order-2 md:order-1 overflow-x-auto no-sb">
        {product.images.map((imgUrl, i) => {
          const safeThumb = getSafeProductImage(product, i);
          const isSelected = activeIndex === i;
          return (
            <button
              key={`${imgUrl}-${i}`}
              type="button"
              onClick={() => onSelectIndex(i)}
              onMouseEnter={() => onSelectIndex(i)}
              style={{ aspectRatio: "3/4" }}
              aria-label={`View angle ${i + 1}`}
              className={`relative w-16 md:w-full shrink-0 border border-neutral-200/80 card p-1 flex items-center justify-center overflow-hidden transition-all bg-[#ebebeb] ${
                isSelected ? "bg-white opacity-100" : "opacity-65 hover:opacity-100"
              }`}
            >
              <img
                src={safeThumb}
                alt={`${product.name} angle ${i + 1}`}
                className="w-full h-full object-contain object-center"
                onError={handleProductImageError}
              />
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-black text-white flex items-center justify-center shadow-sm pointer-events-none">
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Selected Image - Click to open zoom popup */}
      <div
        onClick={onOpenZoom}
        role="button"
        tabIndex={0}
        aria-label="Click to enlarge image"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenZoom();
          }
        }}
        className="w-full order-1 md:order-2 card border line flex items-center justify-center overflow-hidden bg-[#ededed] p-4 relative cursor-zoom-in group select-none"
        style={{ aspectRatio: "4/5" }}
      >
        <img
          key={activeIndex}
          src={getSafeProductImage(product, activeIndex)}
          alt={product.name}
          className="w-full h-full object-contain object-center page"
          onError={handleProductImageError}
        />

        {/* Hover visual badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm border line text-[11px] tracking-wider uppercase px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-sm pointer-events-none">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
          <span>Click to zoom</span>
        </div>
      </div>
    </div>
  );
}

