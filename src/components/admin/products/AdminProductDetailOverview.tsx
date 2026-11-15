"use client";

import Link from "next/link";
import { Product } from "@/types";
import {
  DEFAULT_PRODUCT_IMAGE,
  handleProductImageError,
  money,
} from "@/config/utils";
import { APP_ROUTES } from "@/config/routes";
import { UpsertProductInput } from "@/service/products/schema";

interface AdminProductDetailOverviewProps {
  product: Product;
  editForm: UpsertProductInput;
  activePreviewUrl: string;
  onSelectPreviewUrl: (url: string) => void;
  savedShareCode?: string;
  shareUrl: string;
  selectedShareCount: number;
}

export function AdminProductDetailOverview({
  product,
  editForm,
  activePreviewUrl,
  onSelectPreviewUrl,
  savedShareCode,
  shareUrl,
  selectedShareCount,
}: AdminProductDetailOverviewProps) {
  const officialImages = editForm.images || [];
  const tempImages = editForm.temporaryImages || [];
  const allPreviewImages = Array.from(
    new Set([...officialImages, ...tempImages])
  );
  const currentPreview =
    activePreviewUrl && allPreviewImages.includes(activePreviewUrl)
      ? activePreviewUrl
      : allPreviewImages[0] || DEFAULT_PRODUCT_IMAGE;

  const sellingPrice = Number(editForm.price || 0);
  const costPrice =
    editForm.costPrice !== undefined ? Number(editForm.costPrice) : undefined;
  const estimatedProfit =
    costPrice !== undefined ? sellingPrice - costPrice : undefined;
  const profitMarginPercent =
    estimatedProfit !== undefined && sellingPrice > 0
      ? Math.round((estimatedProfit / sellingPrice) * 100)
      : undefined;

  const folderSlug = (editForm.name || product.name || "unnamed")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
      {/* Left: Visual Preview & All Thumbnails */}
      <div className="card p-4 border line bg-white space-y-3">
        <div className="relative aspect-[3/4] w-full border line bg-[#ededed] overflow-hidden flex items-center justify-center">
          <img
            src={currentPreview}
            alt={editForm.name || product.name}
            className="w-full h-full object-contain"
            onError={handleProductImageError}
          />
          <span className="absolute top-2.5 left-2.5 bg-black/80 text-white text-[10px] font-mono uppercase tracking-wider px-2 py-0.5">
            {officialImages.includes(currentPreview)
              ? `Official #${officialImages.indexOf(currentPreview) + 1}`
              : `Temp T${tempImages.indexOf(currentPreview) + 1}`}
          </span>
        </div>

        {/* Thumbnail Strip with Small Checkmark (✓) Indicator */}
        {allPreviewImages.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider mute flex justify-between">
              <span>All Photos ({allPreviewImages.length})</span>
              <span>Click to inspect</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {allPreviewImages.map((imgUrl, idx) => {
                const isCurrent = currentPreview === imgUrl;
                const isTemp =
                  !officialImages.includes(imgUrl) &&
                  tempImages.includes(imgUrl);
                return (
                  <button
                    key={`prev-${idx}-${imgUrl}`}
                    type="button"
                    onClick={() => onSelectPreviewUrl(imgUrl)}
                    className={`relative aspect-[3/4] border border-neutral-200/80 overflow-hidden transition-all bg-[#ebebeb] ${
                      isCurrent
                        ? "opacity-100"
                        : "opacity-60 hover:opacity-95"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleProductImageError}
                    />
                    {isTemp && (
                      <span className="absolute bottom-0.5 left-0.5 bg-neutral-900/80 text-white text-[8px] font-mono px-1">
                        T
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
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
          </div>
        )}
      </div>

      {/* Right: Detailed Product Specs & Financial Metrics */}
      <div className="card p-6 border line bg-white flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b line">
            <div>
              <h2 className="text-xs tracking-widest uppercase font-semibold">
                Product Specification & Overview
              </h2>
              <p className="mute text-xs mt-0.5">
                Complete breakdown of pricing, margin, media zones, and
                inventory details.
              </p>
            </div>
            <span className="px-2.5 py-1 border line text-[11px] uppercase tracking-wider bg-neutral-50 font-medium">
              {editForm.category}
            </span>
          </div>

          {/* Key Financial & Media Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 border line bg-neutral-50/60">
              <div className="text-[10px] uppercase tracking-wider mute">
                Selling Price
              </div>
              <div className="serif text-2xl mt-1">{money(sellingPrice)}</div>
            </div>

            <div className="p-3.5 border line bg-neutral-50/60">
              <div className="text-[10px] uppercase tracking-wider mute">
                Cost Price
              </div>
              <div className="serif text-2xl mt-1">
                {costPrice !== undefined ? money(costPrice) : "—"}
              </div>
            </div>

            <div className="p-3.5 border line bg-neutral-50/60">
              <div className="text-[10px] uppercase tracking-wider mute">
                Est. Margin
              </div>
              <div className="serif text-2xl mt-1">
                {estimatedProfit !== undefined ? (
                  <span
                    className={
                      estimatedProfit >= 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }
                  >
                    {money(estimatedProfit)}{" "}
                    <span className="text-xs font-mono">
                      ({profitMarginPercent}%)
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="p-3.5 border line bg-neutral-50/60">
              <div className="text-[10px] uppercase tracking-wider mute">
                Media Assets
              </div>
              <div className="text-sm font-mono font-semibold mt-2">
                {officialImages.length} Web / {tempImages.length} Temp
              </div>
            </div>
          </div>

          {/* Detailed Attributes Table */}
          <div className="divide-y line border line text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] p-3 gap-1">
              <span className="mute uppercase tracking-wider text-[11px]">
                Sizes Available
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(editForm.sizes || ["OS"]).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 border line bg-neutral-50 font-mono text-[11px]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] p-3 gap-1">
              <span className="mute uppercase tracking-wider text-[11px]">
                Cloudinary Folder
              </span>
              <span className="font-mono text-[11px] break-all">
                tage/products/{folderSlug || "unnamed-product"}/
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] p-3 gap-1">
              <span className="mute uppercase tracking-wider text-[11px]">
                Share Showcase Link
              </span>
              <div>
                {shareUrl && savedShareCode ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/share/${savedShareCode}`}
                      target="_blank"
                      className="font-mono text-[11px] underline hover:opacity-80 break-all"
                    >
                      {shareUrl}
                    </Link>
                    <span className="text-[10px] mute font-mono">
                      ({selectedShareCount} curated photos)
                    </span>
                  </div>
                ) : (
                  <span className="mute text-[11px]">
                    Not generated yet — configure below in Share Studio
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] p-3 gap-1">
              <span className="mute uppercase tracking-wider text-[11px]">
                Description & Notes
              </span>
              <div className="whitespace-pre-line leading-relaxed text-neutral-700">
                {editForm.description ? (
                  editForm.description
                ) : (
                  <span className="mute italic">
                    No description or measurement notes added yet.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Linked Combo Pieces (When part of a Collection / Outfit Combo) */}
          {product.comboItems && product.comboItems.length > 0 && (
            <div className="p-4 border line bg-neutral-50/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-black text-white">
                    Outfit Combo
                  </span>
                  <span className="ml-2 text-xs uppercase tracking-wider font-semibold">
                    {product.comboTitle || "Linked Combo Pieces"} (
                    {product.comboItems.length})
                  </span>
                </div>
                <span className="text-xs font-mono mute">
                  Sum:{" "}
                  {money(
                    product.comboItems.reduce(
                      (s, c) => s + Number(c.price || 0),
                      0
                    )
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {product.comboItems.map((piece) => (
                  <Link
                    key={piece.id}
                    href={APP_ROUTES.ADMIN.productDetail(piece.id)}
                    className="flex items-center gap-3 p-2.5 border line bg-white hover:border-black transition-colors"
                  >
                    <div className="w-11 h-14 border line bg-[#ebebeb] shrink-0 overflow-hidden">
                      <img
                        src={piece.image || DEFAULT_PRODUCT_IMAGE}
                        alt={piece.name}
                        className="w-full h-full object-cover"
                        onError={handleProductImageError}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase tracking-wider mute">
                        {piece.category} · {piece.size || "OS"}
                      </div>
                      <div className="text-xs font-medium truncate">
                        {piece.name}
                      </div>
                      <div className="text-xs font-mono mt-0.5">
                        {money(piece.price)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
