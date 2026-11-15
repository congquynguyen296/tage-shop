"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Product, ProductCategory } from "@/types";
import { UpsertProductInput } from "@/service/products/schema";
import { PRODUCT_CATEGORIES } from "@/hooks/useAdminProducts";

interface AdminProductEditModalProps {
  product: Product;
  editForm: UpsertProductInput;
  errors: Record<string, string>;
  actionLoading: boolean;
  onUpdateField: <K extends keyof UpsertProductInput>(
    field: K,
    val: UpsertProductInput[K]
  ) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const AVAILABLE_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "OS",
  "28",
  "30",
  "32",
  "34",
  "36",
];

export function AdminProductEditModal({
  product,
  editForm,
  errors,
  actionLoading,
  onUpdateField,
  onSubmit,
  onClose,
}: AdminProductEditModalProps) {
  const [newOfficialUrl, setNewOfficialUrl] = useState("");
  const [newTempUrl, setNewTempUrl] = useState("");

  const handleAddOfficialImage = () => {
    if (!newOfficialUrl.trim()) return;
    const current = editForm.images || [];
    if (!current.includes(newOfficialUrl.trim())) {
      onUpdateField("images", [...current, newOfficialUrl.trim()]);
    }
    setNewOfficialUrl("");
  };

  const handleRemoveOfficialImage = (index: number) => {
    const updated = (editForm.images || []).filter((_, i) => i !== index);
    onUpdateField("images", updated);
  };

  const handleAddTempImage = () => {
    if (!newTempUrl.trim()) return;
    const current = editForm.temporaryImages || [];
    if (!current.includes(newTempUrl.trim())) {
      onUpdateField("temporaryImages", [...current, newTempUrl.trim()]);
    }
    setNewTempUrl("");
  };

  const handleRemoveTempImage = (index: number) => {
    const updated = (editForm.temporaryImages || []).filter((_, i) => i !== index);
    onUpdateField("temporaryImages", updated);
  };

  const handleToggleSize = (size: string) => {
    const current = editForm.sizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onUpdateField("sizes", updated.length > 0 ? updated : ["M"]);
  };

  return (
    <div className="card p-6 border line bg-white space-y-6">
      <div className="flex items-center justify-between pb-3 border-b line">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs tracking-widest uppercase font-semibold">
              Edit Product
            </h2>
            <span className="font-mono text-xs mute">ID: {product.id}</span>
          </div>
          <p className="mute text-xs mt-0.5">
            Update product details, selling price, cost price, category, and manage image zones.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm mute hover:text-black"
          aria-label="Close edit modal"
        >
          ✕
        </button>
      </div>

      {/* Main Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <Field
          label="Product Name *"
          value={editForm.name}
          onChange={(v) => onUpdateField("name", v)}
          placeholder="e.g. Vintage Leather Trench"
          error={errors.name}
        />
        <Field
          label="Price ($ USD) *"
          value={String(editForm.price || "")}
          onChange={(v) => onUpdateField("price", Number(v) || 0)}
          type="number"
          placeholder="250"
          error={errors.price}
        />
        <Field
          label="Cost Price ($ USD) (Optional)"
          value={editForm.costPrice !== undefined ? String(editForm.costPrice) : ""}
          onChange={(v) =>
            onUpdateField("costPrice", v ? Number(v) : undefined)
          }
          type="number"
          placeholder="140"
          error={errors.costPrice}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-[11px] tracking-wider uppercase mute mb-1">
            Category *
          </label>
          <select
            value={editForm.category}
            onChange={(e) =>
              onUpdateField("category", e.target.value as ProductCategory)
            }
            className="w-full bg-transparent border line px-3 py-3 text-sm outline-none"
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status: Sold Out */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2.5 p-3 border line cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors">
            <input
              type="checkbox"
              checked={Boolean(editForm.isSoldOut)}
              onChange={(e) => onUpdateField("isSoldOut", e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase">
                Mark as Sold Out
              </span>
              <p className="mute text-[10px]">
                When enabled, the product displays as Sold Out and ordering is disabled on the storefront.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Sizes Selection */}
      <div>
        <label className="block text-[11px] tracking-wider uppercase mute mb-2">
          Sizes *
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SIZES.map((s) => {
            const isSelected = (editForm.sizes || []).includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleToggleSize(s)}
                className={`px-3 py-1.5 text-xs font-mono border line transition-colors ${
                  isSelected
                    ? "bg-black text-white border-black"
                    : "bg-white hover:border-black/50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        {errors.sizes && <p className="text-xs text-red-600 mt-1">{errors.sizes}</p>}
      </div>

      {/* Product Details / Description */}
      <div>
        <label className="block text-[11px] tracking-wider uppercase mute mb-1.5">
          Product Details & Description
        </label>
        <textarea
          rows={4}
          value={editForm.description || ""}
          onChange={(e) => onUpdateField("description", e.target.value)}
          placeholder="Enter measurements, fabric composition, archive era, condition notes..."
          className="w-full bg-transparent border line px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-black transition-colors resize-y"
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1">{errors.description}</p>
        )}
      </div>

      {/* ZONE 1: OFFICIAL IMAGES */}
      <div className="p-4 border line bg-neutral-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase">
              Zone 1: Official Website Images *
            </span>
            <p className="mute text-[11px]">
              Primary photos displayed on storefront catalog and product pages.
            </p>
          </div>
          <span className="text-xs font-mono mute">
            {(editForm.images || []).length} photos
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newOfficialUrl}
            onChange={(e) => setNewOfficialUrl(e.target.value)}
            placeholder="Image path (e.g. /images/products/p1-01.jpg)"
            className="flex-1 bg-white border line px-3 py-2 text-xs outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddOfficialImage();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddOfficialImage}
            className="px-4 py-2 bg-black text-white text-xs tracking-wider uppercase hover:opacity-85"
          >
            Add Image
          </button>
        </div>

        {/* Thumbnails grid */}
        <div className="flex flex-wrap gap-3 pt-2">
          {(editForm.images || []).map((url, i) => (
            <div
              key={i}
              className="relative w-20 h-24 border line bg-white overflow-hidden group shrink-0"
            >
              <img
                src={url}
                alt={`Official ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/images/products/p1-01.jpg";
                }}
              />
              <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] px-1 font-mono">
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveOfficialImage(i)}
                className="absolute top-1 right-1 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove this image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {errors.images && (
          <p className="text-xs text-red-600">{errors.images}</p>
        )}
      </div>

      {/* ZONE 2: TEMPORARY / DRAFT IMAGES */}
      <div className="p-4 border line bg-neutral-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase">
              Zone 2: Temporary & Archive Images
            </span>
            <p className="mute text-[11px]">
              Supplemental archive photos for detail inspection or customer inquiries.
            </p>
          </div>
          <span className="text-xs font-mono mute">
            {(editForm.temporaryImages || []).length} photos
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTempUrl}
            onChange={(e) => setNewTempUrl(e.target.value)}
            placeholder="Temporary image path (e.g. /images/products/p2-01.webp)"
            className="flex-1 bg-white border line px-3 py-2 text-xs outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTempImage();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddTempImage}
            className="px-4 py-2 border line bg-white hover:bg-neutral-100 text-xs tracking-wider uppercase"
          >
            Add Temp Image
          </button>
        </div>

        {/* Thumbnails grid for temp images */}
        <div className="flex flex-wrap gap-3 pt-2">
          {(editForm.temporaryImages || []).map((url, i) => (
            <div
              key={i}
              className="relative w-20 h-24 border line bg-white overflow-hidden group shrink-0"
            >
              <img
                src={url}
                alt={`Temp ${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/images/products/p1-01.jpg";
                }}
              />
              <span className="absolute top-1 left-1 bg-neutral-800/70 text-white text-[9px] px-1 font-mono">
                T{i + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveTempImage(i)}
                className="absolute top-1 right-1 bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove this temp image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}

      <div className="flex gap-3 pt-3 border-t line">
        <button
          type="button"
          disabled={actionLoading}
          onClick={onSubmit}
          className="btn text-xs py-2.5 px-6"
        >
          {actionLoading ? "Saving Changes..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="border border-current px-5 py-2.5 text-xs tracking-wider uppercase"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

