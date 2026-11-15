"use client";

import Link from "next/link";
import { ComboPiece, Product } from "@/types";
import { handleProductImageError, money } from "@/config/utils";
import { useCartStore } from "@/service/cart/store";
import { flyToCart } from "@/components/cart/FlyToCart";

interface ProductComboLookProps {
  currentProductId: string | number;
  comboTitle?: string;
  pieces: ComboPiece[];
  allProducts?: Product[];
}

export function ProductComboLook({
  currentProductId,
  comboTitle,
  pieces,
  allProducts = [],
}: ProductComboLookProps) {
  const addItem = useCartStore((s) => s.addItem);

  if (!pieces || pieces.length === 0) return null;

  const handleAddPiece = (
    piece: ComboPiece,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (piece.isSoldOut) return;

    // Find full product object from allProducts if available, or build minimal
    const matched = allProducts.find((p) => p.id === piece.id);
    const targetProduct: Product = matched || {
      id: piece.id,
      slug: piece.slug,
      name: piece.name,
      color: "Standard",
      colorHex: "#111111",
      price: piece.price,
      originalPrice: piece.originalPrice,
      category: piece.category,
      sizes: piece.size ? [piece.size] : ["One Size"],
      images: [piece.image],
      isSoldOut: piece.isSoldOut,
      variants: [
        {
          id: `var-${piece.id}`,
          sku: `TG-COMBO-${piece.id}`,
          size: piece.size || "OS",
          color: "Standard",
          colorHex: "#111111",
          stock: piece.isSoldOut ? 0 : 1,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const targetSize = piece.size || targetProduct.sizes?.[0] || "One Size";
    const success = addItem(targetProduct, targetSize, 1);
    if (success) {
      flyToCart(piece.image, e.currentTarget);
    }
  };

  return (
    <div className="mt-5 pt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="serif text-xl sm:text-2xl mt-0.5">
            {comboTitle || "Pieces in This Look"}
          </h2>
        </div>
        <span className="text-xs mute font-mono">
          {pieces.length} Pieces
        </span>
      </div>

      <p className="mute text-xs mb-6 leading-relaxed">
        Curated look styled with individual archive pieces. You can inspect and purchase each item shown on the model below:
      </p>

      <div className="space-y-4">
        {pieces.map((piece) => {
          const isCurrent = String(piece.id) === String(currentProductId);

          return (
            <div
              key={piece.id}
              className={`p-3.5 border line flex items-center justify-between gap-4 transition-all ${
                isCurrent
                  ? "bg-neutral-100/90 border-black"
                  : "bg-white hover:border-black/50"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Link
                  href={`/product/${piece.slug}`}
                  className="w-14 h-16 shrink-0 bg-neutral-100 border line overflow-hidden block"
                >
                  <img
                    src={piece.image}
                    alt={piece.name}
                    className="w-full h-full object-cover"
                    onError={handleProductImageError}
                  />
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] tracking-widest uppercase border line px-1.5 py-0.5 bg-neutral-50 mute">
                      {piece.category}
                    </span>
                  </div>
                  <Link
                    href={`/product/${piece.slug}`}
                    className="font-medium text-xs sm:text-sm uppercase tracking-wide truncate block hover:underline mt-1"
                  >
                    {piece.name}
                  </Link>
                  <div className="text-xs mute flex items-center gap-2 mt-0.5">
                    <span>{money(piece.price)}</span>
                    {piece.size && <span>· Size {piece.size}</span>}
                  </div>
                </div>
              </div>

              {/* Action: Add to Cart or Sold Out */}
              <div className="shrink-0 text-right">
                {piece.isSoldOut ? (
                  <span className="inline-block px-3 py-1.5 bg-neutral-200 text-neutral-600 text-[10px] tracking-widest uppercase font-semibold border line">
                    Sold Out
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleAddPiece(piece, e)}
                    className="px-3.5 py-1.5 bg-[color:var(--accent)] text-white text-[10px] tracking-widest uppercase hover:opacity-85 transition-opacity"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

