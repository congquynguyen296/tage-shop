"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductStore } from "@/service/products/store";
import { Product, ProductCategory } from "@/types";
import {
  UpsertProductInput,
  UpsertProductSchema,
} from "@/service/products/schema";
import {
  getAdminProductsAction,
  createAdminProductAction,
  updateAdminProductAction,
  updateAdminStockAction,
  deleteAdminProductAction,
  saveProductShareLinkAction,
} from "@/service/products/actions";

export const ADMIN_PRODUCTS_PAGE_SIZE = 10;

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Outerwear",
  "Tees",
  "Bottoms",
  "Sweatshirt",
  "Items",
  // "Collection", // Themed collections (Temporarily commented out)
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
  images: ["/images/products/p1-01.jpg"],
  temporaryImages: [],
  isNew: true,
  isSale: false,
  isSoldOut: false,
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

  // Sync products from Neon DB on mount if not already loaded by AdminLayout
  useEffect(() => {
    if (useProductStore.getState().products.length > 0) {
      setIsLoadingCatalog(false);
      return;
    }
    let mounted = true;
    setIsLoadingCatalog(true);
    getAdminProductsAction()
      .then((items) => {
        if (mounted && items.length > 0) {
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
  };

  const handleCreateProduct = async () => {
    const parsed = UpsertProductSchema.safeParse(newProd);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setActionLoading(true);
    setStatusMessage("Saving product to Neon Database...");

    try {
      const createdItem = await createAdminProductAction(parsed.data);
      addProduct(createdItem);
      setIsCreating(false);
      resetForm();
      setStatusMessage("Product created successfully in database!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      // Fallback: save to client store
      const localItem = addProduct(parsed.data);
      setIsCreating(false);
      resetForm();
      setStatusMessage("Product saved to local catalog!");
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setSelectedProductId(product.id);
    setEditProd({
      name: product.name,
      color: product.color || "Standard",
      colorHex: product.colorHex || "#111111",
      price: product.price,
      costPrice: product.costPrice,
      category: product.category,
      sizes: product.sizes || ["M"],
      images: product.images || ["/images/products/p1-01.jpg"],
      temporaryImages: product.temporaryImages || [],
      isNew: product.isNew ?? true,
      isSale: product.isSale ?? false,
      isSoldOut: product.isSoldOut ?? false,
      comboId: product.comboId,
      comboTitle: product.comboTitle,
      description: product.description || "",
    });
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
    setActionLoading(true);

    const target = products.find((p) => p.id === productId);
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    try {
      // If new temporary images were added inside the share modal, persist them first
      if (
        target &&
        extraTempImages &&
        extraTempImages.length !== (target.temporaryImages?.length || 0)
      ) {
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

    const parsed = UpsertProductSchema.safeParse(editProd);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setEditErrors(fieldErrors);
      return;
    }

    setEditErrors({});
    setActionLoading(true);
    setStatusMessage("Updating product in database...");

    try {
      await updateAdminProductAction(editingProduct.id, parsed.data);
      updateProduct(editingProduct.id, parsed.data);
      setEditingProduct(null);
      setStatusMessage("Product updated successfully!");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      // Fallback update local store
      updateProduct(editingProduct.id, parsed.data);
      setEditingProduct(null);
      setStatusMessage("Product updated in catalog!");
      setTimeout(() => setStatusMessage(""), 3000);
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
    setStatusMessage("Updating inventory in database...");

    try {
      await updateAdminStockAction(productId, newStock);
      updateVariantStock(productId, variantId, newStock);
      setStatusMessage("Stock updated in database!");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch {
      updateVariantStock(productId, variantId, newStock);
      setStatusMessage("Stock updated locally!");
      setTimeout(() => setStatusMessage(""), 2000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number | string, productName: string) => {
    if (confirm(`Delete ${productName}?`)) {
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
        setStatusMessage("Product deleted from database!");
        setTimeout(() => setStatusMessage(""), 2000);
      } catch {
        deleteProduct(productId);
        setStatusMessage("Product deleted from catalog!");
        setTimeout(() => setStatusMessage(""), 2000);
      } finally {
        setActionLoading(false);
      }
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
    updateNewProdField,
    handleCreateProduct,
    handleStockChange,
    handleDeleteProduct,
    toggleSelectProduct,
    setSelectedProductId,
  };
}

export type UseAdminProductsReturn = ReturnType<typeof useAdminProducts>;
