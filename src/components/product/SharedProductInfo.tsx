"use client";

import { Product } from "@/types";
import {
  DEFAULT_PRODUCT_IMAGE,
  handleProductImageError,
  money,
  INSTAGRAM_SHOP_URL,
  INSTAGRAM_HANDLE,
} from "@/config/utils";
import { Accordion } from "@/components/ui/Accordion";

interface SharedProductInfoProps {
  product: Product;
  curatedCount: number;
  onContactInstagram: () => void;
}

export function SharedProductInfo({
  product,
  curatedCount,
  onContactInstagram,
}: SharedProductInfoProps) {
  const productSize =
    product.sizes?.[0] || product.variants?.[0]?.size || "One Size";
  const isSoldOut = Boolean(product.isSoldOut);

  const accordionItems: Array<[string, string]> = [
    [
      "Details & Condition",
      product.description ||
        "Unique 1-of-1 archive piece curated from the TAGE vault. Thoroughly inspected, authenticated, and conditioned prior to dispatch.",
    ],
    [
      "Shipping & Returns",
      product.shippingAndReturns ||
        "Flat rate shipping of $35. Returns are accepted only if the item arrives with incorrect measurements compared to the description, or color discrepancies compared to product photos.",
    ],
  ];

  return (
    <div className="md:sticky md:top-24 self-start">
      <div className="text-[11px] tracking-[0.25em] uppercase mute mb-1.5">
        {product.category} · 1-of-1 Archive Piece
      </div>
      <h1 className="serif text-3xl md:text-4xl">{product.name}</h1>

      <div className="mt-4 text-lg flex items-center gap-3">
        {product.originalPrice && (
          <span className="mute line-through">
            {money(product.originalPrice)}
          </span>
        )}
        <span className="font-medium">{money(product.price)}</span>
      </div>

      {/* Specifications */}
      <div className="mt-6 pt-4 border-t line space-y-2.5 text-xs tracking-[0.18em] uppercase">
        <div className="flex items-center justify-between">
          <span className="mute">Size</span>
          <span className="font-semibold text-[color:var(--fg)]">
            {productSize}
          </span>
        </div>
        {product.color && (
          <div className="flex items-center justify-between">
            <span className="mute">Color / Tone</span>
            <span className="font-medium text-[color:var(--fg)]">
              {product.color}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="mute">Availability</span>
          {isSoldOut ? (
            <span className="text-red-600 font-semibold">Sold Out</span>
          ) : (
            <span className="text-emerald-700 font-semibold">
              In Stock (Only 1 Piece)
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="mute">Curated Photos</span>
          <span className="font-mono text-[color:var(--fg)]">
            {curatedCount} selected angles
          </span>
        </div>
      </div>

      {/* Collection Combo Pieces Breakdown (Individual Pieces in the Outfit) */}
      {product.comboItems && product.comboItems.length > 0 && (
        <div className="mt-6 pt-4 border-t line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.2em] uppercase font-semibold">
              Included Outfit Pieces ({product.comboItems.length})
            </span>
            <span className="text-[11px] font-mono mute">
              Combo Price: {money(product.price)}
            </span>
          </div>
          <div className="space-y-2">
            {product.comboItems.map((piece) => (
              <div
                key={piece.id}
                className="flex items-center gap-3 p-2.5 border line bg-white/60"
              >
                <div className="w-12 h-16 border line bg-[#ebebeb] shrink-0 overflow-hidden">
                  <img
                    src={piece.image || DEFAULT_PRODUCT_IMAGE}
                    alt={piece.name}
                    className="w-full h-full object-cover"
                    onError={handleProductImageError}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider mute">
                    {piece.category} · Size {piece.size || "OS"}
                  </div>
                  <div className="text-xs font-medium truncate">
                    {piece.name}
                  </div>
                  <div className="text-xs font-mono mt-0.5">
                    {money(piece.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary CTA: Contact & Order via Instagram */}
      <div className="mt-7 space-y-3">
        <button
          type="button"
          disabled={isSoldOut}
          onClick={onContactInstagram}
          className="btn w-full py-4 tracking-[0.22em] text-center disabled:opacity-50"
        >
          {isSoldOut
            ? "Piece Sold Out"
            : "Contact & Purchase via Instagram →"}
        </button>

        <p className="text-[11px] mute text-center leading-relaxed">
          Clicking above copies this piece’s details &amp; link and opens{" "}
          <a
            href={INSTAGRAM_SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[color:var(--fg)]"
          >
            {INSTAGRAM_HANDLE}
          </a>{" "}
          on Instagram.
        </p>
      </div>

      <Accordion items={accordionItems} />
    </div>
  );
}
