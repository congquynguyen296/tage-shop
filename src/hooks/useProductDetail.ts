"use client";

import { useEffect, useState, useMemo } from "react";
import { Product } from "@/types";
import { useProductStore } from "@/service/products/store";
import { useAuthStore } from "@/service/auth/store";
import {
  fetchProductBySlugApi,
  fetchRelatedProductsApi,
  fetchRecentlyViewedApi,
  trackRecentlyViewedApi,
  findProductSync,
} from "@/service/products/queries";

export function useProductDetail(slug: string) {
  const products = useProductStore((s) => s.products);
  const recentlyViewedIds = useProductStore((s) => s.recentlyViewedIds);
  const addRecentlyViewed = useProductStore((s) => s.addRecentlyViewed);
  const upsertProductDetail = useProductStore((s) => s.upsertProductDetail);
  const upsertProductsToCache = useProductStore((s) => s.upsertProductsToCache);
  const user = useAuthStore((s) => s.user);

  // Instant initial lookup from store cache if available
  const cachedProduct = useMemo(
    () => findProductSync(slug, products),
    [slug, products]
  );

  const [product, setProduct] = useState<Product | null>(cachedProduct);
  const [loading, setLoading] = useState<boolean>(!cachedProduct);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(true);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<
    Product[]
  >([]);
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] =
    useState<boolean>(true);
  const [imgIdx, setImgIdx] = useState<number>(0);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

  // Reset image index when navigating between products
  useEffect(() => {
    setImgIdx(0);
    setIsZoomOpen(false);
  }, [slug]);

  // 1. Fetch Product Detail API & save to Zustand store
  useEffect(() => {
    let cancelled = false;
    const currentCached = findProductSync(
      slug,
      useProductStore.getState().products
    );
    if (!currentCached) {
      setProduct(null);
      setLoading(true);
    } else {
      setProduct(currentCached);
      setLoading(false);
    }

    fetchProductBySlugApi(slug)
      .then((res) => {
        if (!cancelled) {
          if (res.success && res.data) {
            setProduct(res.data);
            // Persist full product detail into Zustand store cache
            upsertProductDetail(res.data);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, upsertProductDetail]);

  // 2. Fetch Related Products API
  useEffect(() => {
    let cancelled = false;
    setRelatedProducts([]);
    setLoadingRelated(true);

    fetchRelatedProductsApi(slug)
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          setRelatedProducts(res.data);
          // Warm normalized lookup cache without clobbering main shop catalog
          if (res.data.length > 0) {
            upsertProductsToCache(res.data);
          }
        }
      })
      .catch(() => {
        // Fallback to store products if offline
        if (!cancelled) {
          setRelatedProducts(
            products
              .filter((p) => p.slug !== slug && String(p.id) !== slug)
              .slice(0, 8)
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRelated(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, upsertProductsToCache]);

  // 3. Track & Fetch Recently Viewed (DB for logged-in user, localStorage for Guest)
  useEffect(() => {
    let cancelled = false;

    // Always record in localStorage for instant offline/guest continuity
    addRecentlyViewed(slug);

    if (user?.id) {
      setLoadingRecentlyViewed(true);
      // trackRecentlyViewedApi is deduplicated so StrictMode remount shares the single POST request
      trackRecentlyViewedApi(slug)
        .then(() => {
          if (cancelled) return;
          return fetchRecentlyViewedApi({ exclude: slug }).then((res) => {
            if (!cancelled && res.success) {
              setRecentlyViewedProducts(res.data);
              if (res.data.length > 0) {
                upsertProductsToCache(res.data);
              }
            }
          });
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingRecentlyViewed(false);
          }
        });
    } else {
      // Guest user: Use localStorage IDs/slugs and hydrate from API / store cache
      const guestKeys = recentlyViewedIds
        .map(String)
        .filter((k) => k !== slug && k !== String(cachedProduct?.id));

      // Immediate render from store cache
      const localMatches = guestKeys
        .map((key) => findProductSync(key, products))
        .filter((p): p is Product => p !== null && p.slug !== slug);
      setRecentlyViewedProducts(localMatches);

      if (guestKeys.length > 0) {
        setLoadingRecentlyViewed(localMatches.length === 0);
        fetchRecentlyViewedApi({ exclude: slug, guestIds: guestKeys })
          .then((res) => {
            if (!cancelled && res.success && res.data.length > 0) {
              setRecentlyViewedProducts(res.data);
              upsertProductsToCache(res.data);
            }
          })
          .finally(() => {
            if (!cancelled) {
              setLoadingRecentlyViewed(false);
            }
          });
      } else {
        setLoadingRecentlyViewed(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [slug, user?.id, addRecentlyViewed, upsertProductsToCache]);

  return {
    product,
    loading,
    relatedProducts,
    loadingRelated,
    recentlyViewedProducts,
    loadingRecentlyViewed,
    imgIdx,
    setImgIdx,
    isZoomOpen,
    setIsZoomOpen,
  };
}
