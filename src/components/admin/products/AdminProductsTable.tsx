"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { money } from "@/config/utils";
import { AdminProductsTableSkeletonRows } from "@/components/product/ProductSkeleton";

interface AdminProductsTableProps {
  products: Product[];
  isLoading?: boolean;
  selectedProductId: number | string | null;
  onShare: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: number | string, productName: string) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function AdminProductsTable({
  products,
  isLoading = false,
  selectedProductId,
  onShare,
  onEdit,
  onDelete,
  searchQuery,
  onClearSearch,
}: AdminProductsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  return (
    <div className="card border line bg-white overflow-visible">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b line bg-neutral-50 tracking-wider uppercase text-[11px] mute">
            <th className="p-4">Item</th>
            <th className="p-4">Category</th>
            <th className="p-4">Price / Cost</th>
            <th className="p-4">Status & Sizes</th>
            <th className="p-4">Photos (Official / Temp)</th>
            <th className="p-4 text-right w-16">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y line">
          {isLoading && products.length === 0 ? (
            <AdminProductsTableSkeletonRows rows={6} />
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-12 text-center text-xs mute">
                {searchQuery ? (
                  <div className="space-y-2">
                    <p>
                      No products found matching &ldquo;
                      <span className="text-black font-medium">
                        {searchQuery}
                      </span>
                      &rdquo;
                    </p>
                    {onClearSearch && (
                      <button
                        onClick={onClearSearch}
                        className="ul uppercase text-[11px] tracking-wider text-black font-medium"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <p>No products available in catalog.</p>
                )}
              </td>
            </tr>
          ) : (
            products.map((p) => {
              const isSelected = selectedProductId === p.id;
              const officialCount = p.images?.length || 0;
              const tempCount = p.temporaryImages?.length || 0;
              const isMenuOpen = openMenuId === p.id;

              return (
                <tr
                  key={p.id}
                  className={`hover:bg-neutral-50/70 transition-colors ${
                    isSelected ? "bg-neutral-100/60" : ""
                  }`}
                >
                  <td className="p-4 flex items-center gap-3">
                    <div className="relative w-12 h-14 shrink-0 card line border overflow-hidden">
                      <img
                        src={p.images[0] || "/images/products/p1-01.jpg"}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/images/products/p1-01.jpg";
                        }}
                      />
                      {p.isSoldOut && (
                        <span className="absolute inset-x-0 bottom-0 bg-black/85 text-white text-[8px] tracking-wider uppercase text-center font-bold py-0.5">
                          Sold Out
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="mute text-[10px] font-mono mt-0.5">
                        ID: {p.id} {p.comboId && `· ${p.comboId}`}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 border line text-[10px] uppercase tracking-wider bg-neutral-50">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold">{money(p.price)}</div>
                    <div className="mute text-[10px]">
                      Cost: {p.costPrice ? money(p.costPrice) : "—"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.isSoldOut ? (
                        <span className="px-2 py-0.5 text-[10px] bg-red-100 text-red-700 font-semibold uppercase tracking-wider border border-red-200">
                          Sold Out
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider border border-emerald-200">
                          Available
                        </span>
                      )}
                      <span className="mute text-[10px]">
                        Sizes: {p.sizes?.join(", ") || "OS"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono">
                    <span className="text-black font-medium">
                      {officialCount} official
                    </span>
                    {tempCount > 0 && (
                      <span className="mute ml-1">/ {tempCount} temp</span>
                    )}
                  </td>
                  <td className="p-4 text-right relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : p.id);
                      }}
                      aria-label="Product actions"
                      className="w-8 h-8 inline-flex items-center justify-center border border-transparent hover:border-neutral-300 hover:bg-neutral-100 text-base leading-none transition-colors"
                    >
                      ⋯
                    </button>

                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 top-11 z-30 w-32 bg-white border line shadow-md py-1 text-left"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onShare(p);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs uppercase tracking-wider hover:bg-neutral-100 transition-colors block"
                        >
                          Share
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(p);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs uppercase tracking-wider hover:bg-neutral-100 transition-colors block"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(p.id, p.name);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors block"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
