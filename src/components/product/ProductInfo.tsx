"use client";

import { Product } from "@/types";
import { money, getSafeProductImage } from "@/config/utils";
import { useProductStore } from "@/service/products/store";
import { useCartStore } from "@/service/cart/store";
import { flyToCart } from "@/components/cart/FlyToCart";
import { Accordion } from "@/components/ui/Accordion";
import { ProductComboLook } from "@/components/product/ProductComboLook";

interface ProductInfoProps {
  product: Product;
  activeImageIndex: number;
}

export function ProductInfo({ product, activeImageIndex }: ProductInfoProps) {
  const addItem = useCartStore((s) => s.addItem);
  const allProducts = useProductStore((s) => s.products);

  // Second hand nature: each product only has 1 unique piece and 1 size
  const productSize =
    product.sizes?.[0] || product.variants?.[0]?.size || "One Size";
  const activeVariant =
    product.variants?.find((v) => v.size === productSize) ||
    product.variants?.[0];
  const isOutOfStock = Boolean(
    product.isSoldOut || (activeVariant ? activeVariant.stock <= 0 : false)
  );

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOutOfStock) return;
    const success = addItem(product, productSize, 1);
    if (success) {
      flyToCart(
        getSafeProductImage(product, activeImageIndex),
        e.currentTarget
      );
    }
  };

  const accordionItems: Array<[string, string]> = [
    [
      "Details & Condition",
      product.description ||
        "Unique archive piece. Relaxed, considered fit with clean architectural finishing. Thoroughly inspected and conditioned.",
    ],
    [
      "Shipping & Returns",
      product.shippingAndReturns ||
        "Flat rate shipping of $35. Returns are accepted only if the item arrives with incorrect measurements compared to the description, or color discrepancies compared to product photos. Return requests must be initiated within 7 days of delivery.",
    ],
  ];

  return (
    <div className="md:sticky md:top-24 self-start">
      <div>
        <h1 className="serif text-3xl md:text-4xl">{product.name}</h1>
        <div className="mute text-xs uppercase tracking-widest mt-1">
          {product.category}
        </div>
      </div>

      <div className="mt-4 text-lg">
        {product.originalPrice && (
          <span className="mute line-through mr-3">
            {money(product.originalPrice)}
          </span>
        )}
        <span>{money(product.price)}</span>
      </div>

      {/* Size Info as Text */}
      <div className="mt-6 pt-4 border-t line flex items-center justify-between text-xs tracking-[0.2em] uppercase">
        <div className="flex items-center gap-1.5">
          <span className="mute">Size:</span>
          <span className="font-semibold text-[color:var(--fg)] text-sm">
            {productSize}
          </span>
        </div>
        {isOutOfStock && (
          <span className="text-red-500 font-semibold tracking-wider">Sold out</span>
        )}
      </div>

      {/* Add to Cart button */}
      <div className="mt-6">
        <button
          type="button"
          className="btn w-full py-4 tracking-[0.25em]"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? "Sold out" : "Add to cart"}
        </button>
      </div>

      {/* Details Accordion */}
      <Accordion items={accordionItems} />

      {/* Shop the Look / Combo Pieces */}
      {product.comboItems && product.comboItems.length > 0 && (
        <ProductComboLook
          currentProductId={product.id}
          comboTitle={product.comboTitle}
          pieces={product.comboItems}
          allProducts={allProducts}
        />
      )}
    </div>
  );
}

