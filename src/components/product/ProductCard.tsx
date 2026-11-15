"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Product } from "@/types";
import {
  money,
  getSafeProductImage,
  handleProductImageError,
} from "@/config/utils";
import { useCartStore } from "@/service/cart/store";
import { flyToCart } from "@/components/cart/FlyToCart";
import { useDevice } from "@/hooks/useDevice";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isMobile, isMounted } = useDevice();
  const addItem = useCartStore((s) => s.addItem);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [getSafeProductImage(product)];
  const totalImages = images.length;
  const isMulti = totalImages > 1;

  // Extended track for seamless infinite horizontal slide
  // Structure: [lastImage, ...allImages, firstImage]
  const extendedImages = isMulti
    ? [
        getSafeProductImage(product, totalImages - 1),
        ...images.map((_, i) => getSafeProductImage(product, i)),
        getSafeProductImage(product, 0),
      ]
    : [getSafeProductImage(product, 0)];

  const [trackIndex, setTrackIndex] = useState(isMulti ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isSlidingRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const hasSwipedRef = useRef(false);

  useEffect(() => {
    setTrackIndex(isMulti ? 1 : 0);
    setIsTransitioning(false);
    isSlidingRef.current = false;
  }, [product.id, isMulti]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    hasSwipedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = touchStartXRef.current - e.touches[0].clientX;
    const diffY = touchStartYRef.current - e.touches[0].clientY;

    if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      hasSwipedRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY =
      touchStartYRef.current !== null
        ? touchStartYRef.current - e.changedTouches[0].clientY
        : 0;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY)) {
      hasSwipedRef.current = true;
      if (diffX > 0) {
        if (!isMulti || isSlidingRef.current) return;
        isSlidingRef.current = true;
        setIsTransitioning(true);
        setTrackIndex((prev) => prev + 1);
      } else {
        if (!isMulti || isSlidingRef.current) return;
        isSlidingRef.current = true;
        setIsTransitioning(true);
        setTrackIndex((prev) => prev - 1);
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasSwipedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasSwipedRef.current = false;
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMulti || isSlidingRef.current) return;
    isSlidingRef.current = true;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMulti || isSlidingRef.current) return;
    isSlidingRef.current = true;
    setIsTransitioning(true);
    setTrackIndex((prev) => prev + 1);
  };

  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    isSlidingRef.current = false;
    if (trackIndex === 0) {
      setTrackIndex(totalImages);
    } else if (trackIndex === totalImages + 1) {
      setTrackIndex(1);
    }
  };

  const activeRealIndex = isMulti
    ? (trackIndex - 1 + totalImages) % totalImages
    : 0;

  const displaySize = product.sizes?.[0] || product.variants?.[0]?.size || "One Size";
  const isSoldOut = Boolean(
    product.isSoldOut ||
      (product.variants && product.variants.length > 0 && product.variants.every((v) => v.stock <= 0))
  );

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    const success = addItem(product, displaySize, 1);
    if (success) {
      flyToCart(getSafeProductImage(product, activeRealIndex), e.currentTarget);
    }
  };

  return (
    <div className="group rv in">
      <div
        className="relative overflow-hidden card select-none"
        style={{ aspectRatio: "3/4" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Animated Carousel Track with smooth horizontal glide */}
        <div
          className="flex h-full w-full pointer-events-none"
          style={{
            transform: isMulti
              ? `translate3d(-${trackIndex * 100}%, 0, 0)`
              : "none",
            transition: isTransitioning
              ? "transform 450ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "none",
            willChange: "transform",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedImages.map((imgSrc, i) => (
            <div key={i} className="relative w-full h-full shrink-0">
              {/* Note: Do not use .pimg to prevent hover zoom on the card */}
              <img
                src={imgSrc}
                alt={`${product.name} angle ${i}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                onError={handleProductImageError}
              />
            </div>
          ))}
        </div>

        {/* Clickable Card Link */}
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          onClick={handleCardClick}
          className="absolute inset-0 z-10"
        />

        {/* Subtle Minimalist Dots Indicator for Mobile & Multi-image products */}
        {isMulti && (
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1 z-20 pointer-events-none">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  activeRealIndex === idx
                    ? "w-3.5 bg-white shadow-sm"
                    : "w-1 bg-white/45 backdrop-blur-sm"
                }`}
              />
            ))}
          </div>
        )}

        {isSoldOut ? (
          <span className="absolute left-3 top-3 bg-black text-white text-[10px] tracking-widest px-2.5 py-1 uppercase z-20 pointer-events-none font-semibold">
            Sold Out
          </span>
        ) : product.originalPrice ? (
          <span className="absolute left-3 top-3 bg-white text-black text-[10px] tracking-widest px-2 py-1 uppercase z-20 pointer-events-none">
            Sale
          </span>
        ) : null}

        {/* Left Arrow Button (Slide Left) - Desktop only */}
        {(!isMobile || !isMounted) && (
          <button
            type="button"
            onClick={handlePrevImage}
            aria-label="Previous image"
            className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black shadow-md items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 hover:scale-105 active:scale-95"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Right Arrow Button (Slide Right) - Desktop only */}
        {(!isMobile || !isMounted) && (
          <button
            type="button"
            onClick={handleNextImage}
            aria-label="Next image"
            className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black shadow-md items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 hover:scale-105 active:scale-95"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Add to Cart button on card hover - Desktop only */}
        {(!isMobile || !isMounted) && (
          <div className="hidden sm:block absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-[color:var(--bg)]/95 backdrop-blur-sm p-2.5 z-20">
            <button
              type="button"
              disabled={isSoldOut}
              onClick={handleAddToCart}
              className={`w-full text-[11px] tracking-[0.2em] uppercase py-2.5 font-medium transition-opacity ${
                isSoldOut
                  ? "bg-neutral-300 text-neutral-600 cursor-not-allowed"
                  : "bg-[color:var(--accent)] text-white hover:opacity-90"
              }`}
            >
              {isSoldOut ? "Sold out" : "Add to cart"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-3 pt-3.5 sm:pt-4 text-[13px]">
        <div>
          <Link href={`/product/${product.slug}`} className="uppercase tracking-wide block">
            {product.name}
          </Link>
          <div className="mute text-xs mt-0.5">
            {product.category}
            {displaySize && ` · Size ${displaySize}`}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2.5 whitespace-nowrap mt-1 sm:mt-0">
          <div>
            {product.originalPrice && (
              <span className="mute line-through mr-2">{money(product.originalPrice)}</span>
            )}
            <span>{money(product.price)}</span>
          </div>

          {/* Quick Add to Cart icon button for mobile only (inline with price) */}
          {(isMobile || !isMounted) && !isSoldOut && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
              className="sm:hidden p-1.5 -mr-1 text-[color:var(--fg)] hover:opacity-70 active:scale-90 transition-transform flex items-center justify-center"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M5 8h14l-1 12H6L5 8z" />
                <path d="M9 8V6a3 3 0 016 0v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
