"use client";

import Link from "next/link";
import { Product } from "@/types";
import { UpsertProductInput } from "@/service/products/schema";
import { APP_ROUTES } from "@/config/routes";

interface AdminProductDetailTopBarProps {
  product: Product;
  editForm: UpsertProductInput;
  savedShareCode?: string;
  isDeleting: boolean;
  onRequestDelete: () => void;
}

export function AdminProductDetailTopBar({
  product,
  editForm,
  savedShareCode,
  isDeleting,
  onRequestDelete,
}: AdminProductDetailTopBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b line">
      <div className="space-y-1.5">
        <Link
          href={APP_ROUTES.ADMIN.PRODUCTS}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest mute hover:text-black transition-colors"
        >
          <span>←</span>
          <span>Back to Products</span>
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="serif text-2xl sm:text-3xl tracking-tight">
            {editForm.name || product.name}
          </h1>
          {editForm.isSoldOut ? (
            <span className="px-2.5 py-0.5 text-[10px] bg-red-100 text-red-700 font-semibold uppercase tracking-wider border border-red-200">
              Sold Out
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider border border-emerald-200">
              Available
            </span>
          )}
        </div>
        <div className="text-[11px] font-mono mute flex items-center gap-3 flex-wrap">
          <span>ID: {product.id}</span>
          {product.slug && <span>· Slug: {product.slug}</span>}
          {product.comboId && <span>· Combo: {product.comboId}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {savedShareCode && (
          <Link
            href={APP_ROUTES.SHARE.byCode(savedShareCode)}
            target="_blank"
            className="px-4 py-2.5 border line bg-white hover:border-black text-xs uppercase tracking-wider transition-colors"
          >
            Open Share Page ↗
          </Link>
        )}
        <button
          type="button"
          disabled={isDeleting}
          onClick={onRequestDelete}
          className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          Delete Product
        </button>
      </div>
    </div>
  );
}
