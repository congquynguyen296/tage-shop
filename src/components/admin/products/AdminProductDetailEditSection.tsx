"use client";

import { ProductCategory } from "@/types";
import { UpsertProductInput, UploadMediaZone } from "@/service/products/schema";
import { PRODUCT_CATEGORIES } from "@/hooks/useAdminProducts";
import { Field } from "@/components/ui/Field";
import { ProductImageUploadZone } from "./ProductImageUploadZone";
import { AdminCollectionComboSelector } from "./AdminCollectionComboSelector";

interface AdminProductDetailEditSectionProps {
  currentProductId?: string | number;
  editForm: UpsertProductInput;
  errors: Record<string, string>;
  isSavingProduct: boolean;
  hasProductChanges: boolean;
  uploadingZones: Record<UploadMediaZone, boolean>;
  uploadErrors: Record<UploadMediaZone, string>;
  onUpdateField: <K extends keyof UpsertProductInput>(
    field: K,
    val: UpsertProductInput[K]
  ) => void;
  onUploadImages: (files: File[], zone: UploadMediaZone) => Promise<void>;
  onSaveChanges: () => void;
  onResetChanges: () => void;
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

export function AdminProductDetailEditSection({
  currentProductId,
  editForm,
  errors,
  isSavingProduct,
  hasProductChanges,
  uploadingZones,
  uploadErrors,
  onUpdateField,
  onUploadImages,
  onSaveChanges,
  onResetChanges,
}: AdminProductDetailEditSectionProps) {
  const handleToggleSize = (size: string) => {
    const current = editForm.sizes || [];
    const updated = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onUpdateField("sizes", updated.length > 0 ? updated : ["M"]);
  };

  const handleAddOfficialUrl = (url: string) => {
    const current = editForm.images || [];
    if (!current.includes(url)) {
      onUpdateField("images", [...current, url]);
    }
  };

  const handleRemoveOfficialImage = (index: number) => {
    const updated = (editForm.images || []).filter((_, i) => i !== index);
    onUpdateField("images", updated);
  };

  const handleSetPrimaryOfficialImage = (index: number) => {
    const current = [...(editForm.images || [])];
    if (index <= 0 || index >= current.length) return;
    const [selected] = current.splice(index, 1);
    onUpdateField("images", [selected, ...current]);
  };

  const handleAddTempUrl = (url: string) => {
    const current = editForm.temporaryImages || [];
    if (!current.includes(url)) {
      onUpdateField("temporaryImages", [...current, url]);
    }
  };

  const handleRemoveTempImage = (index: number) => {
    const updated = (editForm.temporaryImages || []).filter(
      (_, i) => i !== index
    );
    onUpdateField("temporaryImages", updated);
  };

  return (
    <div className="card p-6 border line bg-white space-y-6">
      <div className="flex items-center justify-between pb-3 border-b line">
        <div>
          <h2 className="text-xs tracking-widest uppercase font-semibold">
            Edit Product Details & Media Zones
          </h2>
          <p className="mute text-xs mt-0.5">
            Modify product title, pricing, sizes, availability, description, and
            manage Cloudinary photos.
          </p>
        </div>
        {hasProductChanges && (
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200">
            Unsaved Changes
          </span>
        )}
      </div>

      {/* Main Info Fields */}
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
          value={
            editForm.costPrice !== undefined ? String(editForm.costPrice) : ""
          }
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
                When enabled, the product displays as Sold Out and ordering is
                disabled on the storefront.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Collection Combo Selector (Only visible when category === "Collection") */}
      <AdminCollectionComboSelector
        category={editForm.category}
        currentProductId={currentProductId}
        selectedComboIds={editForm.comboItemIds || []}
        comboTitle={editForm.comboTitle}
        onChangeComboIds={(ids) => onUpdateField("comboItemIds", ids)}
        onChangeComboTitle={(title) => onUpdateField("comboTitle", title)}
        onApplySumPrice={(sum) => onUpdateField("price", sum)}
      />

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
        {errors.sizes && (
          <p className="text-xs text-red-600 mt-1">{errors.sizes}</p>
        )}
      </div>

      {/* Product Details / Description */}
      <div>
        <label className="block text-[11px] tracking-wider uppercase mute mb-1.5">
          Product Details & Description
        </label>
        <textarea
          rows={5}
          value={editForm.description || ""}
          onChange={(e) => onUpdateField("description", e.target.value)}
          placeholder="Enter measurements, fabric composition, archive era, condition notes..."
          className="w-full bg-transparent border line px-3 py-2.5 text-xs leading-relaxed outline-none focus:border-black transition-colors resize-y"
        />
        {errors.description && (
          <p className="text-xs text-red-600 mt-1">{errors.description}</p>
        )}
      </div>

      {/* ZONE 1: OFFICIAL WEBSITE IMAGES (CLOUDINARY UPLOAD) */}
      <ProductImageUploadZone
        title="Zone 1: Official Website Images *"
        description="Primary photos displayed on storefront catalog and product pages. Upload directly to Cloudinary or paste URL."
        badgePrefix="#"
        images={editForm.images || []}
        isUploading={uploadingZones.official}
        error={errors.images}
        uploadError={uploadErrors.official}
        onUploadFiles={(files) => onUploadImages(files, "official")}
        onAddUrl={handleAddOfficialUrl}
        onRemoveImage={handleRemoveOfficialImage}
        onSetPrimaryImage={handleSetPrimaryOfficialImage}
      />

      {/* ZONE 2: TEMPORARY & ARCHIVE IMAGES (CLOUDINARY UPLOAD) */}
      <ProductImageUploadZone
        title="Zone 2: Temporary & Archive Images"
        description="Supplemental archive photos for detail inspection or customer share links."
        badgePrefix="T"
        images={editForm.temporaryImages || []}
        isUploading={uploadingZones.temporary}
        uploadError={uploadErrors.temporary}
        onUploadFiles={(files) => onUploadImages(files, "temporary")}
        onAddUrl={handleAddTempUrl}
        onRemoveImage={handleRemoveTempImage}
      />

      {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}

      <div className="flex items-center gap-3 pt-3 border-t line">
        <button
          type="button"
          disabled={
            isSavingProduct ||
            uploadingZones.official ||
            uploadingZones.temporary ||
            !hasProductChanges
          }
          onClick={onSaveChanges}
          className="btn text-xs py-2.5 px-6 disabled:opacity-45"
        >
          {isSavingProduct ? "Saving Changes..." : "Save Changes"}
        </button>
        {hasProductChanges && (
          <button
            type="button"
            disabled={isSavingProduct}
            onClick={onResetChanges}
            className="border border-current px-5 py-2.5 text-xs tracking-wider uppercase hover:bg-neutral-50"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
