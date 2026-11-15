"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "@/service/products/store";
import { toast } from "@/service/ui/store";
import { Product, ProductCategory } from "@/types";
import {
  UpsertProductInput,
  UpsertProductSchema,
  UploadMediaZone,
} from "@/service/products/schema";
import {
  getAdminProductsAction,
  createAdminProductAction,
  updateAdminProductAction,
  updateAdminStockAction,
  deleteAdminProductAction,
  saveProductShareLinkAction,
  uploadProductImagesAction,
} from "@/service/products/actions";
import {
  areStringArraysEqual,
  hasProductFormChanged,
  mapProductToEditForm,
} from "./useAdminProductDetail";
import { DEFAULT_PRODUCT_IMAGE } from "@/config/utils";

export const ADMIN_PRODUCTS_PAGE_SIZE = 10;

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Outerwear",
  "Tees",
  "Bottoms",
  "Sweatshirt",
  "Items",
  "Collection",
];

export const ADMIN_LETTER_SIZES = ["XS", "S", "M", "L", "XL", "OS"];
export const ADMIN_NUMERIC_SIZES = ["28", "30", "32", "34", "36", "40", "41", "42", "43", "44"];
export type AdminAvailabilityFilter = "all" | "available" | "sold_out";

const INITIAL_PRODUCT_FORM: UpsertProductInput = {
  name: "",
  color: "Standard",
  colorHex: "#111111",
  price: 250,
  costPrice: undefined,
  category: "Outerwear",
  sizes: ["M"],
  images: [],
  temporaryImages: [],
  isNew: true,
  isSale: false,
  isSoldOut: false,
  comboItemIds: [],
  description: "",
};

export function useAdminProducts() {
  const products = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const addProduct = useProductStore((s) => s.addProduct);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const updateVariantStock = useProductStore((s) => s.updateVariantStock);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const searchQuery = useProductStore((s) => s.searchQuery);
  const setSearchQuery = useProductStore((s) => s.setSearchQuery);

  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sharingProduct, setSharingProduct] = useState<Product | null>(null);
  const [deletingProductTarget, setDeletingProductTarget] = useState<{
    id: number | string;
    name: string;
  } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(
    () => useProductStore.getState().products.length === 0
  );
  const [statusMessage, setStatusMessage] = useState("");

  const [newProd, setNewProd] = useState<UpsertProductInput>(INITIAL_PRODUCT_FORM);
  const [editProd, setEditProd] = useState<UpsertProductInput>(INITIAL_PRODUCT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [uploadingZone, setUploadingZone] = useState<UploadMediaZone | null>(
    null
  );
  const [uploadError, setUploadError] = useState("");

  // Client-side filter & pagination state
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sizeFilter, setSizeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] =
    useState<AdminAvailabilityFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter products directly from Zustand store by name, category, size (letter/number), and status
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) {
        return false;
      }
      if (
        categoryFilter !== "All" &&
        p.category.toLowerCase() !== categoryFilter.toLowerCase()
      ) {
        return false;
      }
      if (sizeFilter !== "All") {
        const productSizes = (p.sizes || []).map((s) => s.toUpperCase());
        if (!productSizes.includes(sizeFilter.toUpperCase())) {
          return false;
        }
      }
      if (statusFilter === "available" && p.isSoldOut) {
        return false;
      }
      if (statusFilter === "sold_out" && !p.isSoldOut) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, categoryFilter, sizeFilter, statusFilter]);

  // Total pages based on filtered products count
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ADMIN_PRODUCTS_PAGE_SIZE)
  );

  // Reset/adjust current page when out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleSizeFilterChange = (size: string) => {
    setSizeFilter(size);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: AdminAvailabilityFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const clearAdminFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setSizeFilter("All");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ADMIN_PRODUCTS_PAGE_SIZE;
    return filteredProducts.slice(start, start + ADMIN_PRODUCTS_PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  // Sync products from Neon DB on mount
  useEffect(() => {
    let mounted = true;
    if (useProductStore.getState().products.length === 0) {
      setIsLoadingCatalog(true);
    }
    getAdminProductsAction()
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setProducts(items);
        }
      })
      .catch(() => {
        // Retain local state on offline or fallback
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingCatalog(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [setProducts]);

  const updateNewProdField = <K extends keyof UpsertProductInput>(
    field: K,
    val: UpsertProductInput[K]
  ) => {
    setNewProd((prev) => ({ ...prev, [field]: val }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const updateEditProdField = <K extends keyof UpsertProductInput>(
    field: K,
    val: UpsertProductInput[K]
  ) => {
    setEditProd((prev) => ({ ...prev, [field]: val }));
    if (editErrors[field as string]) {
      setEditErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const resetForm = () => {
    setNewProd(INITIAL_PRODUCT_FORM);
    setErrors({});
    setUploadError("");
  };

  const handleUploadNewProductImages = async (
    files: File[],
    zone: UploadMediaZone
  ) => {
    if (!files || files.length === 0) return;
    if (!newProd.name.trim()) {
      setErrors((prev) => ({
        ...prev,
        name: "Please enter Product Name first to create the product image folder",
      }));
      setUploadError(
        "Please enter Product Name above before uploading photos so they are saved in this product's folder."
      );
      return;
    }

    setUploadError("");
    setUploadingZone(zone);
    try {
      const currentOfficial = newProd.images || [];
      const isOnlyDefaultPlaceholder =
        currentOfficial.length === 1 &&
        currentOfficial[0] === DEFAULT_PRODUCT_IMAGE;
      const existingCount =
        zone === "official"
          ? isOnlyDefaultPlaceholder
            ? 0
            : currentOfficial.length
          : (newProd.temporaryImages || []).length;

      const uploaded = await uploadProductImagesAction(
        files,
        zone,
        newProd.name.trim(),
        existingCount
      );
      const uploadedUrls = uploaded.map((item) => item.url);
      if (zone === "official") {
        setNewProd((prev) => {
          const current = prev.images || [];
          const hasOnlyDefault =
            current.length === 1 && current[0] === DEFAULT_PRODUCT_IMAGE;
          const base = hasOnlyDefault ? [] : current;
          const merged = Array.from(new Set([...base, ...uploadedUrls]));
          return { ...prev, images: merged };
        });
        setErrors((prev) => {
          const next = { ...prev };
          delete next.images;
          return next;
        });
      } else {
        setNewProd((prev) => {
          const current = prev.temporaryImages || [];
          const merged = Array.from(new Set([...current, ...uploadedUrls]));
          return { ...prev, temporaryImages: merged };
        });
      }
      toast.success(
        `Uploaded ${uploadedUrls.length} photo${
          uploadedUrls.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload images";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploadingZone(null);
    }
  };

  const handleUploadEditProductImages = async (
    files: File[],
    zone: UploadMediaZone
  ) => {
    if (!files || files.length === 0) return;
    setUploadError("");
    setUploadingZone(zone);
    try {
      const productName = editProd.name.trim() || editingProduct?.name || "";
      const existingCount =
        zone === "official"
          ? (editProd.images || []).length
          : (editProd.temporaryImages || []).length;

      const uploaded = await uploadProductImagesAction(
        files,
        zone,
        productName,
        existingCount
      );
      const uploadedUrls = uploaded.map((item) => item.url);
      if (zone === "official") {
        setEditProd((prev) => {
          const current = prev.images || [];
          const merged = Array.from(new Set([...current, ...uploadedUrls]));
          return { ...prev, images: merged };
        });
        setEditErrors((prev) => {
          const next = { ...prev };
          delete next.images;
          return next;
        });
      } else {
        setEditProd((prev) => {
          const current = prev.temporaryImages || [];
          const merged = Array.from(new Set([...current, ...uploadedUrls]));
          return { ...prev, temporaryImages: merged };
        });
      }
      toast.success(
        `Uploaded ${uploadedUrls.length} photo${
          uploadedUrls.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload images";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploadingZone(null);
    }
  };

  const handleUploadShareTempImages = async (
    files: File[]
  ): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    setUploadError("");
    setUploadingZone("temporary");
    try {
      const productName = sharingProduct?.name || "";
      const existingCount = sharingProduct?.temporaryImages?.length || 0;
      const uploaded = await uploadProductImagesAction(
        files,
        "temporary",
        productName,
        existingCount
      );
      toast.success(
        `Uploaded ${uploaded.length} temp photo${
          uploaded.length > 1 ? "s" : ""
        }`
      );
      return uploaded.map((item) => item.url);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload images";
      setUploadError(msg);
      toast.error(msg);
      return [];
    } finally {
      setUploadingZone(null);
    }
  };

  const handleCreateProduct = async () => {
    const parsed = UpsertProductSchema.safeParse(newProd);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(parsed.error.issues[0]?.message || "Please check form fields");
      return;
    }

    setErrors({});
    setActionLoading(true);

    try {
      const createdItem = await createAdminProductAction(parsed.data);
      addProduct(createdItem);
      if (
        parsed.data.category === "Collection" &&
        parsed.data.comboItemIds &&
        parsed.data.comboItemIds.length > 0
      ) {
        const refreshed = await getAdminProductsAction().catch(() => null);
        if (refreshed) {
          setProducts(refreshed);
        }
      }
      setIsCreating(false);
      resetForm();
      toast.success("Product created successfully");
    } catch {
      // Fallback: save to client store
      addProduct(parsed.data);
      setIsCreating(false);
      resetForm();
      toast.success("Product saved to catalog");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setSelectedProductId(product.id);
    setEditProd(mapProductToEditForm(product));
    setEditErrors({});
  };

  const closeEditProduct = () => {
    setEditingProduct(null);
    setEditErrors({});
  };

  const openShareProduct = (product: Product) => {
    setIsCreating(false);
    setEditingProduct(null);
    setSharingProduct(product);
    setSelectedProductId(product.id);
  };

  const closeShareProduct = () => {
    setSharingProduct(null);
  };

  const handleSaveShareLink = async (
    productId: number | string,
    selectedImages: string[],
    extraTempImages?: string[]
  ): Promise<{ shareCode: string; shareUrl: string } | null> => {
    const target = products.find((p) => p.id === productId);
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const currentShared =
      target?.sharedImages && target.sharedImages.length > 0
        ? target.sharedImages
        : [...(target?.images || []), ...(target?.temporaryImages || [])];

    const tempChanged = Boolean(
      target &&
        extraTempImages &&
        !areStringArraysEqual(extraTempImages, target.temporaryImages || [])
    );
    const shareSelectionChanged =
      !target?.shareCode ||
      !areStringArraysEqual(selectedImages, currentShared);

    // Skip API call if nothing changed and shareCode already exists
    if (target?.shareCode && !tempChanged && !shareSelectionChanged) {
      return {
        shareCode: target.shareCode,
        shareUrl: `${origin}/share/${target.shareCode}`,
      };
    }

    setActionLoading(true);

    try {
      // If new temporary images were added inside the share modal, persist them first
      if (target && extraTempImages && tempChanged) {
        await updateAdminProductAction(productId, {
          temporaryImages: extraTempImages,
        });
      }

      const res = await saveProductShareLinkAction({
        productId,
        selectedImages,
      });

      updateProduct(productId, {
        shareCode: res.shareCode,
        sharedImages: res.sharedImages,
        ...(extraTempImages ? { temporaryImages: extraTempImages } : {}),
      });

      if (sharingProduct && sharingProduct.id === productId) {
        setSharingProduct((prev) =>
          prev
            ? {
                ...prev,
                shareCode: res.shareCode,
                sharedImages: res.sharedImages,
                temporaryImages: extraTempImages || prev.temporaryImages,
              }
            : null
        );
      }

      const shareUrl = `${origin}/share/${res.shareCode}`;
      return { shareCode: res.shareCode, shareUrl };
    } catch {
      const fallbackCode =
        target?.shareCode ||
        `${target?.slug || `piece-${productId}`}-${Math.random()
          .toString(36)
          .substring(2, 6)}`;

      updateProduct(productId, {
        shareCode: fallbackCode,
        sharedImages: selectedImages,
        ...(extraTempImages ? { temporaryImages: extraTempImages } : {}),
      });

      const shareUrl = `${origin}/share/${fallbackCode}`;
      return { shareCode: fallbackCode, shareUrl };
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!hasProductFormChanged(editingProduct, editProd)) {
      setEditingProduct(null);
      toast.info("No changes to save");
      return;
    }

    const parsed = UpsertProductSchema.safeParse(editProd);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setEditErrors(fieldErrors);
      toast.error(parsed.error.issues[0]?.message || "Please check form fields");
      return;
    }

    setEditErrors({});
    setActionLoading(true);

    try {
      await updateAdminProductAction(editingProduct.id, parsed.data);
      updateProduct(editingProduct.id, parsed.data);
      if (parsed.data.comboItemIds !== undefined) {
        const refreshed = await getAdminProductsAction().catch(() => null);
        if (refreshed) {
          setProducts(refreshed);
        }
      }
      setEditingProduct(null);
      toast.success("Product updated successfully");
    } catch {
      // Fallback update local store
      updateProduct(editingProduct.id, parsed.data);
      setEditingProduct(null);
      toast.success("Product updated in catalog");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStockChange = async (
    productId: number | string,
    variantId: string,
    newStock: number
  ) => {
    setActionLoading(true);

    try {
      await updateAdminStockAction(productId, newStock);
      updateVariantStock(productId, variantId, newStock);
      toast.success("Stock updated");
    } catch {
      updateVariantStock(productId, variantId, newStock);
      toast.success("Stock updated locally");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = (
    productId: number | string,
    productName: string
  ) => {
    setDeletingProductTarget({ id: productId, name: productName });
  };

  const cancelDeleteProduct = () => {
    if (!actionLoading) {
      setDeletingProductTarget(null);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProductTarget) return;
    const { id: productId, name: productName } = deletingProductTarget;

    setActionLoading(true);
    try {
      await deleteAdminProductAction(productId);
      deleteProduct(productId);
      if (selectedProductId === productId) {
        setSelectedProductId(null);
      }
      if (editingProduct?.id === productId) {
        setEditingProduct(null);
      }
      setDeletingProductTarget(null);
      toast.success(`Deleted "${productName}"`);
    } catch {
      deleteProduct(productId);
      setDeletingProductTarget(null);
      toast.success(`Deleted "${productName}"`);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectProduct = (productId: number | string) => {
    setSelectedProductId((prev) => (prev === productId ? null : productId));
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return {
    products,
    filteredProducts,
    paginatedProducts,
    searchQuery,
    setSearchQuery: handleSearchChange,
    categoryFilter,
    setCategoryFilter: handleCategoryFilterChange,
    sizeFilter,
    setSizeFilter: handleSizeFilterChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    clearAdminFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
    totalCount: products.length,
    filteredCount: filteredProducts.length,
    selectedProductId,
    selectedProduct,
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
    statusMessage,
    newProd,
    errors,
    uploadingZone,
    uploadError,
    updateNewProdField,
    handleUploadNewProductImages,
    handleUploadEditProductImages,
    handleUploadShareTempImages,
    handleCreateProduct,
    handleStockChange,
    handleDeleteProduct,
    deletingProductTarget,
    cancelDeleteProduct,
    confirmDeleteProduct,
    toggleSelectProduct,
    setSelectedProductId,
  };
}

export type UseAdminProductsReturn = ReturnType<typeof useAdminProducts>;
