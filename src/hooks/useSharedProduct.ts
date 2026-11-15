"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/types";
import { useProductStore } from "@/service/products/store";
import {
  fetchSharedProductApi,
  findProductSync,
} from "@/service/products/queries";
import {
  INSTAGRAM_DM_URL,
  generateInstagramProductShareMessage,
} from "@/config/utils";

export function useSharedProduct(code: string) {
  const products = useProductStore((s) => s.products);
  const upsertProductDetail = useProductStore((s) => s.upsertProductDetail);

  const cachedProduct = useMemo(
    () => findProductSync(code, products),
    [code, products]
  );

  const [product, setProduct] = useState<Product | null>(cachedProduct);
  const [loading, setLoading] = useState<boolean>(!cachedProduct);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState("");

  useEffect(() => {
    setActiveImageIndex(0);
    setZoomOpen(false);
    setCopied(false);
    setGeneratedMsg("");
  }, [code]);

  useEffect(() => {
    let cancelled = false;

    const currentCached = findProductSync(
      code,
      useProductStore.getState().products
    );
    if (currentCached) {
      setProduct(currentCached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchSharedProductApi(code)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setProduct(res.data);
          upsertProductDetail(res.data);
        }
      })
      .catch(() => {
        // Retain cached product if offline
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, upsertProductDetail]);

  const curatedImages = useMemo(() => {
    if (!product) return ["/images/products/p1-01.jpg"];
    if (product.sharedImages && product.sharedImages.length > 0) {
      return product.sharedImages;
    }
    const combined = [
      ...(product.images || []),
      ...(product.temporaryImages || []),
    ];
    return combined.length > 0 ? combined : ["/images/products/p1-01.jpg"];
  }, [product]);

  const displayProduct = useMemo<Product | null>(() => {
    if (!product) return null;
    return {
      ...product,
      images: curatedImages,
    };
  }, [product, curatedImages]);

  const handleContactInstagram = async () => {
    if (!displayProduct) return;
    const productSize =
      displayProduct.sizes?.[0] ||
      displayProduct.variants?.[0]?.size ||
      "One Size";
    const shareUrl =
      typeof window !== "undefined" ? window.location.href : undefined;

    const message = generateInstagramProductShareMessage({
      name: displayProduct.name,
      slug: displayProduct.slug,
      size: productSize,
      color: displayProduct.color,
      price: displayProduct.price,
      shareUrl,
    });

    setGeneratedMsg(message);

    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(message).catch(() => {});
      setCopied(true);
    }

    window.open(INSTAGRAM_DM_URL, "_blank", "noopener,noreferrer");
  };

  const handleCopyAgain = async () => {
    if (!generatedMsg) return;
    if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(generatedMsg).catch(() => {});
      setCopied(true);
    }
  };

  const handleSelectPhotoZoom = (index: number) => {
    setActiveImageIndex(index);
    setZoomOpen(true);
  };

  return {
    product: displayProduct,
    rawProduct: product,
    curatedImages,
    loading,
    activeImageIndex,
    setActiveImageIndex,
    zoomOpen,
    setZoomOpen,
    copied,
    generatedMsg,
    handleContactInstagram,
    handleCopyAgain,
    handleSelectPhotoZoom,
  };
}
