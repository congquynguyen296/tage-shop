"use client";

import { use } from "react";
import Link from "next/link";
import { APP_ROUTES } from "@/config/routes";
import { useAdminProductDetail } from "@/hooks/useAdminProductDetail";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { AdminProductDetailTopBar } from "@/components/admin/products/AdminProductDetailTopBar";
import { AdminProductDetailOverview } from "@/components/admin/products/AdminProductDetailOverview";
import { AdminProductDetailShareSection } from "@/components/admin/products/AdminProductDetailShareSection";
import { AdminProductDetailEditSection } from "@/components/admin/products/AdminProductDetailEditSection";

export default function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    product,
    isLoading,
    isSavingProduct,
    isSavingShare,
    isDeleting,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
    hasProductChanges,
    uploadingZones,
    uploadErrors,
    editForm,
    errors,
    updateField,
    handleResetChanges,
    handleUploadImages,
    handleSaveChanges,
    activePreviewUrl,
    setActivePreviewUrl,
    selectedShareImages,
    toggleShareImage,
    selectAllShareImages,
    clearShareImages,
    newQuickTempUrl,
    setNewQuickTempUrl,
    handleAddQuickTempUrl,
    savedShareCode,
    shareUrl,
    copiedShare,
    shareErrorMsg,
    copyShareUrlToClipboard,
    handleSaveAndCopyShareLink,
  } = useAdminProductDetail(id);

  if (isLoading && !product) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs tracking-widest uppercase mute">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card p-10 border line bg-white text-center space-y-4">
        <div className="text-xs tracking-widest uppercase mute">
          Product Not Found
        </div>
        <h1 className="serif text-2xl">
          Could not find product with ID &ldquo;{decodeURIComponent(id)}&rdquo;
        </h1>
        <div className="pt-2">
          <Link
            href={APP_ROUTES.ADMIN.PRODUCTS}
            className="btn text-xs py-2.5 px-6 inline-block"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Top Navigation, Metadata & Quick Actions */}
      <AdminProductDetailTopBar
        product={product}
        editForm={editForm}
        savedShareCode={savedShareCode}
        isDeleting={isDeleting}
        onRequestDelete={openDeleteModal}
      />

      {/* 2. Detailed Product Overview (Visual Gallery + Financial & Inventory Specs) */}
      <AdminProductDetailOverview
        product={product}
        editForm={editForm}
        activePreviewUrl={activePreviewUrl}
        onSelectPreviewUrl={setActivePreviewUrl}
        savedShareCode={savedShareCode}
        shareUrl={shareUrl}
        selectedShareCount={selectedShareImages.length}
      />

      {/* 3. Curated Client Share Studio */}
      <AdminProductDetailShareSection
        officialImages={editForm.images || []}
        tempImages={editForm.temporaryImages || []}
        selectedShareImages={selectedShareImages}
        savedShareCode={savedShareCode}
        shareUrl={shareUrl}
        copiedShare={copiedShare}
        shareErrorMsg={shareErrorMsg}
        isSavingShare={isSavingShare}
        isUploadingTemp={uploadingZones.temporary}
        newQuickTempUrl={newQuickTempUrl}
        onChangeQuickTempUrl={setNewQuickTempUrl}
        onAddQuickTempUrl={handleAddQuickTempUrl}
        onToggleShareImage={toggleShareImage}
        onSelectAllShareImages={selectAllShareImages}
        onClearShareImages={clearShareImages}
        onUploadTempFiles={(files) => handleUploadImages(files, "temporary")}
        onCopyShareUrl={copyShareUrlToClipboard}
        onSaveAndCopyShareLink={handleSaveAndCopyShareLink}
      />

      {/* 4. Edit Product Details & Cloudinary Media Zones */}
      <AdminProductDetailEditSection
        currentProductId={product.id}
        editForm={editForm}
        errors={errors}
        isSavingProduct={isSavingProduct}
        hasProductChanges={hasProductChanges}
        uploadingZones={uploadingZones}
        uploadErrors={uploadErrors}
        onUpdateField={updateField}
        onUploadImages={handleUploadImages}
        onSaveChanges={handleSaveChanges}
        onResetChanges={handleResetChanges}
      />

      {/* 5. Delete Confirmation Modal Popup */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDanger
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}
