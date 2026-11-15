"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { useProductStore } from "@/service/products/store";
import { toast } from "@/service/ui/store";
import {
  UpsertProductInput,
  UpsertProductSchema,
  UploadMediaZone,
} from "@/service/products/schema";
import {
  getAdminProductsAction,
  updateAdminProductAction,
  deleteAdminProductAction,
  saveProductShareLinkAction,
  uploadProductImagesAction,
} from "@/service/products/actions";
import { APP_ROUTES } from "@/config/routes";
import { DEFAULT_PRODUCT_IMAGE } from "@/config/utils";

export function areStringArraysEqual(
  a: string[] = [],
  b: string[] = []
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function mapProductToEditForm(product: Product): UpsertProductInput {
  return {
    name: product.name,
    color: product.color || "Standard",
    colorHex: product.colorHex || "#111111",
    price: product.price,
    costPrice: product.costPrice,
    category: product.category,
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ["M"],
    images:
      product.images && product.images.length > 0
        ? product.images
        : [],
    temporaryImages: product.temporaryImages || [],
    isNew: product.isNew ?? true,
    isSale: product.isSale ?? false,
    isSoldOut: product.isSoldOut ?? false,
    comboId: product.comboId,
    comboTitle: product.comboTitle,
    comboItemIds: (product.comboItems || []).map((c) => String(c.id)),
    description: product.description || "",
  };
}

export function hasProductFormChanged(
  product: Product,
  form: UpsertProductInput
): boolean {
  const base = mapProductToEditForm(product);
  if (form.name.trim() !== base.name.trim()) return true;
  if (Number(form.price) !== Number(base.price)) return true;
  if ((form.costPrice ?? undefined) !== (base.costPrice ?? undefined)) {
    return true;
  }
  if (form.category !== base.category) return true;
  if (Boolean(form.isSoldOut) !== Boolean(base.isSoldOut)) return true;
  if ((form.description || "").trim() !== (base.description || "").trim()) {
    return true;
  }
  if ((form.comboTitle || "").trim() !== (base.comboTitle || "").trim()) {
    return true;
  }
  if (!areStringArraysEqual(form.sizes || [], base.sizes || [])) return true;
  if (!areStringArraysEqual(form.images || [], base.images || [])) return true;
  if (
    !areStringArraysEqual(
      form.temporaryImages || [],
      base.temporaryImages || []
    )
  ) {
    return true;
  }
  if (
    !areStringArraysEqual(
      [...(form.comboItemIds || [])].sort(),
      [...(base.comboItemIds || [])].sort()
    )
  ) {
    return true;
  }
  return false;
}

export function useAdminProductDetail(productIdParam: string) {
  const router = useRouter();
  const decodedId = decodeURIComponent(productIdParam);

  const products = useProductStore((s) => s.products);
  const setProducts = useProductStore((s) => s.setProducts);
  const updateProduct = useProductStore((s) => s.updateProduct);
  const deleteProduct = useProductStore((s) => s.deleteProduct);

  const product = useMemo(
    () =>
      products.find(
        (p) =>
          String(p.id) === decodedId ||
          (p.slug && p.slug.toLowerCase() === decodedId.toLowerCase())
      ) || null,
    [products, decodedId]
  );

  const [isLoading, setIsLoading] = useState<boolean>(() => !product);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [uploadingCounts, setUploadingCounts] = useState<
    Record<UploadMediaZone, number>
  >({
    official: 0,
    temporary: 0,
  });
  const [uploadErrors, setUploadErrors] = useState<
    Record<UploadMediaZone, string>
  >({
    official: "",
    temporary: "",
  });

  const uploadingZones: Record<UploadMediaZone, boolean> = {
    official: uploadingCounts.official > 0,
    temporary: uploadingCounts.temporary > 0,
  };

  // Edit Form State
  const [editForm, setEditForm] = useState<UpsertProductInput>(() =>
    product
      ? mapProductToEditForm(product)
      : {
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
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Share Studio State
  const [selectedShareImages, setSelectedShareImages] = useState<string[]>([]);
  const [savedShareCode, setSavedShareCode] = useState<string | undefined>(
    product?.shareCode
  );
  const [copiedShare, setCopiedShare] = useState(false);
  const [shareErrorMsg, setShareErrorMsg] = useState("");
  const [newQuickTempUrl, setNewQuickTempUrl] = useState("");

  // Active Preview Image in Overview Gallery
  const [activePreviewUrl, setActivePreviewUrl] = useState<string>("");

  // Fetch catalog on direct page load if not yet in store
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getAdminProductsAction()
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setProducts(items);
        }
      })
      .catch(() => {
        // Fallback to local store
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [setProducts]);

  // Synchronize form & share selection when product loads or changes ID
  useEffect(() => {
    if (!product) return;
    setEditForm(mapProductToEditForm(product));
    setSavedShareCode(product.shareCode);

    const allAvailablePhotos = [
      ...(product.images || []),
      ...(product.temporaryImages || []),
    ];
    if (product.sharedImages && product.sharedImages.length > 0) {
      setSelectedShareImages(product.sharedImages);
    } else {
      setSelectedShareImages(allAvailablePhotos);
    }

    setActivePreviewUrl(
      product.images?.[0] ||
        product.temporaryImages?.[0] ||
        DEFAULT_PRODUCT_IMAGE
    );
  }, [product?.id]);

  // Dirty check: Has any product field changed compared to saved product?
  const hasProductChanges = useMemo(() => {
    if (!product) return false;
    return hasProductFormChanged(product, editForm);
  }, [product, editForm]);

  const updateField = <K extends keyof UpsertProductInput>(
    field: K,
    val: UpsertProductInput[K]
  ) => {
    setEditForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  const handleResetChanges = () => {
    if (!product) return;
    setEditForm(mapProductToEditForm(product));
    setErrors({});
    setUploadErrors({ official: "", temporary: "" });
    toast.info("Changes reset");
  };

  const handleUploadImages = async (files: File[], zone: UploadMediaZone) => {
    if (!files || files.length === 0 || !product) return;
    setUploadErrors((prev) => ({ ...prev, [zone]: "" }));
    setUploadingCounts((prev) => ({ ...prev, [zone]: prev[zone] + 1 }));

    try {
      const productName = editForm.name.trim() || product.name;
      const existingCount =
        zone === "official"
          ? (editForm.images || []).length
          : (editForm.temporaryImages || []).length;

      const uploaded = await uploadProductImagesAction(
        files,
        zone,
        productName,
        existingCount
      );
      const uploadedUrls = uploaded.map((item) => item.url);

      if (zone === "official") {
        setEditForm((prev) => {
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
        setEditForm((prev) => {
          const current = prev.temporaryImages || [];
          const merged = Array.from(new Set([...current, ...uploadedUrls]));
          return { ...prev, temporaryImages: merged };
        });
      }

      setSelectedShareImages((prev) =>
        Array.from(new Set([...prev, ...uploadedUrls]))
      );
      toast.success(
        `Uploaded ${uploadedUrls.length} ${zone === "official" ? "official" : "temp"} photo${
          uploadedUrls.length > 1 ? "s" : ""
        }`
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload images";
      setUploadErrors((prev) => ({ ...prev, [zone]: msg }));
      toast.error(msg);
    } finally {
      setUploadingCounts((prev) => ({
        ...prev,
        [zone]: Math.max(0, prev[zone] - 1),
      }));
    }
  };

  const handleSaveChanges = async () => {
    if (!product) return;

    if (!hasProductChanges) {
      toast.info("No changes to save");
      return;
    }

    const parsed = UpsertProductSchema.safeParse(editForm);
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
    setIsSavingProduct(true);

    try {
      const updated = await updateAdminProductAction(product.id, parsed.data);
      updateProduct(product.id, parsed.data);
      if (updated || parsed.data.comboItemIds !== undefined) {
        const refreshed = await getAdminProductsAction().catch(() => null);
        if (refreshed) {
          setProducts(refreshed);
        }
      }
      toast.success("Product updated successfully");
    } catch {
      updateProduct(product.id, parsed.data);
      toast.success("Product updated in catalog");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      await deleteAdminProductAction(product.id);
      deleteProduct(product.id);
      setIsDeleteModalOpen(false);
      toast.success(`Deleted "${product.name}"`);
      router.push(APP_ROUTES.ADMIN.PRODUCTS);
    } catch {
      deleteProduct(product.id);
      setIsDeleteModalOpen(false);
      toast.success(`Deleted "${product.name}"`);
      router.push(APP_ROUTES.ADMIN.PRODUCTS);
    } finally {
      setIsDeleting(false);
    }
  };

  // Share Studio Handlers
  const toggleShareImage = (url: string) => {
    setShareErrorMsg("");
    setSelectedShareImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const selectAllShareImages = () => {
    setShareErrorMsg("");
    const allPhotos = Array.from(
      new Set([
        ...(editForm.images || []),
        ...(editForm.temporaryImages || []),
      ])
    );
    setSelectedShareImages(allPhotos);
  };

  const clearShareImages = () => {
    setShareErrorMsg("");
    setSelectedShareImages([]);
  };

  const handleAddQuickTempUrl = () => {
    const trimmed = newQuickTempUrl.trim();
    if (!trimmed) return;
    const currentTemps = editForm.temporaryImages || [];
    if (!currentTemps.includes(trimmed)) {
      updateField("temporaryImages", [...currentTemps, trimmed]);
    }
    if (!selectedShareImages.includes(trimmed)) {
      setSelectedShareImages((prev) => [...prev, trimmed]);
    }
    setNewQuickTempUrl("");
    toast.info("Added temporary image URL");
  };

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const shareUrl = savedShareCode ? `${origin}/share/${savedShareCode}` : "";

  const copyShareUrlToClipboard = async (urlToCopy: string) => {
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(urlToCopy).catch(() => {});
      setCopiedShare(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleSaveAndCopyShareLink = async () => {
    if (!product) return;
    if (selectedShareImages.length === 0) {
      setShareErrorMsg("Please select at least 1 photo to share.");
      toast.error("Please select at least 1 photo to share");
      return;
    }

    setShareErrorMsg("");

    const savedSharedList =
      product.sharedImages && product.sharedImages.length > 0
        ? product.sharedImages
        : [...(product.images || []), ...(product.temporaryImages || [])];

    const imagesChanged =
      !areStringArraysEqual(editForm.images || [], product.images || []) ||
      !areStringArraysEqual(
        editForm.temporaryImages || [],
        product.temporaryImages || []
      );

    const shareSelectionChanged =
      !savedShareCode ||
      !areStringArraysEqual(selectedShareImages, savedSharedList);

    // If nothing changed and share link already exists, skip API call and just copy
    if (!imagesChanged && !shareSelectionChanged && shareUrl) {
      await copyShareUrlToClipboard(shareUrl);
      return;
    }

    setIsSavingShare(true);

    try {
      // Only call updateAdminProductAction if official or temp images actually changed
      if (imagesChanged) {
        await updateAdminProductAction(product.id, {
          images: editForm.images,
          temporaryImages: editForm.temporaryImages,
        });
      }

      const res = await saveProductShareLinkAction({
        productId: product.id,
        selectedImages: selectedShareImages,
      });

      updateProduct(product.id, {
        images: editForm.images,
        temporaryImages: editForm.temporaryImages,
        shareCode: res.shareCode,
        sharedImages: res.sharedImages,
      });

      setSavedShareCode(res.shareCode);
      const fullShareUrl = `${origin}/share/${res.shareCode}`;
      await copyShareUrlToClipboard(fullShareUrl);
    } catch {
      const fallbackCode =
        savedShareCode ||
        `${product.slug || `piece-${product.id}`}-${Math.random()
          .toString(36)
          .substring(2, 6)}`;

      updateProduct(product.id, {
        images: editForm.images,
        temporaryImages: editForm.temporaryImages,
        shareCode: fallbackCode,
        sharedImages: selectedShareImages,
      });

      setSavedShareCode(fallbackCode);
      const fullShareUrl = `${origin}/share/${fallbackCode}`;
      await copyShareUrlToClipboard(fullShareUrl);
    } finally {
      setIsSavingShare(false);
    }
  };

  return {
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
  };
}
