import { Product, ProductVariant } from "@/types";

interface AdminVariantStockEditorProps {
  product: Product;
  actionLoading: boolean;
  onStockChange: (productId: number | string, variantId: string, newStock: number) => void;
  onClose: () => void;
}

export function AdminVariantStockEditor({
  product,
  actionLoading,
  onStockChange,
  onClose,
}: AdminVariantStockEditorProps) {
  return (
    <div className="card p-6 border line bg-white space-y-4">
      <div className="flex items-center justify-between pb-3 border-b line">
        <h2 className="text-xs tracking-widest uppercase font-semibold">
          Quick Inventory Editor — {product.name}
        </h2>
        <button
          onClick={onClose}
          className="text-xs mute underline"
        >
          Done
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {product.variants.map((variant: ProductVariant) => (
          <div key={variant.id} className="p-3 border line bg-neutral-50/50">
            <div className="font-semibold text-xs mb-1">
              Size: {variant.size}
            </div>
            <div className="text-[10px] mute mb-2">SKU: {variant.sku}</div>
            <div className="flex items-center gap-2">
              <button
                disabled={actionLoading || variant.stock <= 0}
                onClick={() =>
                  onStockChange(product.id, variant.id, variant.stock - 1)
                }
                className="w-7 h-7 border line flex items-center justify-center hover:bg-neutral-200 disabled:opacity-40"
              >
                −
              </button>
              <span className="font-medium text-sm w-8 text-center">
                {variant.stock}
              </span>
              <button
                disabled={actionLoading}
                onClick={() =>
                  onStockChange(product.id, variant.id, variant.stock + 1)
                }
                className="w-7 h-7 border line flex items-center justify-center hover:bg-neutral-200 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

