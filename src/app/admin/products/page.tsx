"use client";

import { useAdminProducts } from "@/hooks/useAdminProducts";
import { AdminProductHeader } from "@/components/admin/products/AdminProductHeader";
import { AdminProductCreateModal } from "@/components/admin/products/AdminProductCreateModal";
import { AdminProductEditModal } from "@/components/admin/products/AdminProductEditModal";
import { AdminProductShareModal } from "@/components/admin/products/AdminProductShareModal";
import { AdminProductsTable } from "@/components/admin/products/AdminProductsTable";
import { AdminProductSearchBar } from "@/components/admin/products/AdminProductSearchBar";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function AdminProductsPage() {
  const {
    paginatedProducts,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sizeFilter,
    setSizeFilter,
    statusFilter,
    setStatusFilter,
    clearAdminFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalCount,
    filteredCount,
    selectedProductId,
    isCreating,
    setIsCreating,
    editingProduct,
    openEditProduct,
    closeEditProduct,
    sharingProduct,
    openShareProduct,
    closeShareProduct,
    handleSaveShareLink,
    editProd,
    editErrors,
    updateEditProdField,
    handleUpdateProduct,
    actionLoading,
    isLoadingCatalog,
    newProd,
    errors,
    uploadingZones,
    uploadErrors,
    updateNewProdField,
    handleUploadNewProductImages,
    handleUploadEditProductImages,
    handleUploadShareTempImages,
    handleCreateProduct,
    handleDeleteProduct,
    deletingProductTarget,
    cancelDeleteProduct,
    confirmDeleteProduct,
  } = useAdminProducts();

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminProductHeader
        onOpenCreate={() => {
          closeEditProduct();
          closeShareProduct();
          setIsCreating(true);
        }}
      />

      {/* Modal for Curated Client Share Link */}
      {sharingProduct && (
        <AdminProductShareModal
          product={sharingProduct}
          actionLoading={actionLoading}
          isUploading={uploadingZones.temporary}
          onUploadTempFiles={handleUploadShareTempImages}
          onSaveShareLink={handleSaveShareLink}
          onClose={closeShareProduct}
        />
      )}

      {/* Modal for Product Creation */}
      {isCreating && (
        <AdminProductCreateModal
          newProd={newProd}
          errors={errors}
          actionLoading={actionLoading}
          uploadingZones={uploadingZones}
          uploadErrors={uploadErrors}
          onUpdateField={updateNewProdField}
          onUploadImages={handleUploadNewProductImages}
          onSubmit={handleCreateProduct}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* Modal for Product Editing */}
      {editingProduct && (
        <AdminProductEditModal
          product={editingProduct}
          editForm={editProd}
          errors={editErrors}
          actionLoading={actionLoading}
          uploadingZones={uploadingZones}
          uploadErrors={uploadErrors}
          onUpdateField={updateEditProdField}
          onUploadImages={handleUploadEditProductImages}
          onSubmit={handleUpdateProduct}
          onClose={closeEditProduct}
        />
      )}

      {/* Search & Filter Bar */}
      <AdminProductSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sizeFilter={sizeFilter}
        onSizeFilterChange={setSizeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearAllFilters={clearAdminFilters}
        totalCount={totalCount}
        filteredCount={filteredCount}
        currentPage={currentPage}
        pageSize={pageSize}
      />

      {/* Products & Inventory Table */}
      <AdminProductsTable
        products={paginatedProducts}
        isLoading={isLoadingCatalog}
        selectedProductId={selectedProductId}
        searchQuery={searchQuery}
        onClearSearch={clearAdminFilters}
        onShare={openShareProduct}
        onEdit={(p) => {
          setIsCreating(false);
          closeShareProduct();
          openEditProduct(p);
        }}
        onDelete={handleDeleteProduct}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          autoScrollTop={false}
          className="mt-6 pt-4"
        />
      )}

      {/* Delete Confirmation Modal Popup */}
      <ConfirmModal
        isOpen={Boolean(deletingProductTarget)}
        title="Delete Product"
        message={
          deletingProductTarget
            ? `Are you sure you want to permanently delete "${deletingProductTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        isDanger
        isLoading={actionLoading}
        onConfirm={confirmDeleteProduct}
        onCancel={cancelDeleteProduct}
      />
    </div>
  );
}
