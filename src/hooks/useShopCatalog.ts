"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useProductStore } from "@/service/products/store";
import { fetchProductsApi } from "@/service/products/queries";
import { useUiStore } from "@/service/ui/store";

export const SHOP_PAGE_SIZE = 9;

export const SHOP_CATEGORIES = [
  "All",
  "Top",
  "Bottom",
  "Outerwear",
  "New Arrivals",
];

export function useShopCatalog() {
  const searchParams = useSearchParams();

  // Prioritize Next.js router searchParams first so <Link href="/shop?category=Bottom">
  // from Home / Header / Footer is always accurate on the very first render
  const initialCategory = useMemo(() => {
    const routerCat = searchParams.get("category");
    if (routerCat) return routerCat;
    if (typeof window !== "undefined") {
      const urlCat = new URLSearchParams(window.location.search).get(
        "category"
      );
      if (urlCat) return urlCat;
    }
    return "All";
  }, [searchParams]);

  const shopCatalogCache = useProductStore((s) => s.shopCatalogCache);
  const setShopCatalog = useProductStore((s) => s.setShopCatalog);

  const [category, setCategory] = useState<string>(initialCategory);
  const [sort, setSort] = useState<"new" | "lo" | "hi">("new");
  const [sizes, setSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isSyncingApi, setIsSyncingApi] = useState<boolean>(true);

  const prevParamCatRef = useRef(initialCategory);

  // Sync URL category param when navigated via <Link> from Header / Footer / Home tiles
  useEffect(() => {
    const paramCat = searchParams.get("category") || "All";
    if (paramCat !== prevParamCatRef.current) {
      prevParamCatRef.current = paramCat;
      setCategory(paramCat);
      setPage(1);
    }
  }, [searchParams]);

  // Unique key for the active filter + sort + page combination
  const currentQueryKey = useMemo(
    () =>
      JSON.stringify({
        category,
        sort,
        sizes: [...sizes].sort(),
        maxPrice: maxPrice ?? null,
        page,
      }),
    [category, sort, sizes, maxPrice, page]
  );

  const cachedEntry = shopCatalogCache[currentQueryKey];

  // Call live PostgreSQL API (`/api/products`) on mount, filter change, sort change, or pagination
  useEffect(() => {
    let cancelled = false;
    setIsSyncingApi(true);
    useUiStore.getState().startProgress();

    fetchProductsApi({
      category,
      sizes,
      maxPrice,
      sort,
      page,
      pageSize: SHOP_PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          // Save fetched page keyed by currentQueryKey & merge products into Zustand store
          setShopCatalog({
            queryKey: currentQueryKey,
            items: res.data.items,
            total: res.data.total,
            totalPages: res.data.totalPages,
          });
        }
      })
      .catch(() => {
        // Retain current store state if offline
      })
      .finally(() => {
        if (!cancelled) {
          setIsSyncingApi(false);
          useUiStore.getState().completeProgress();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    category,
    sizes,
    maxPrice,
    sort,
    page,
    currentQueryKey,
    setShopCatalog,
  ]);

  const toggleSize = useCallback((s: string) => {
    setPage(1);
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }, []);

  const handleSelectCategory = useCallback((cat: string) => {
    setCategory(cat);
    setPage(1);
    prevParamCatRef.current = cat;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (cat === "All") {
        params.delete("category");
      } else {
        params.set("category", cat);
      }
      const queryString = params.toString();
      const newUrl = queryString ? `/shop?${queryString}` : "/shop";
      // Shallow URL update: updates browser address bar without triggering Next.js RSC fetch (?_rsc=...)
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSizes([]);
    setMaxPrice(undefined);
    setPage(1);
  }, []);

  const applyFilters = useCallback(
    ({
      sizes: newSizes,
      maxPrice: newMaxPrice,
    }: {
      sizes: string[];
      maxPrice?: number;
    }) => {
      setSizes(newSizes);
      setMaxPrice(newMaxPrice);
      setPage(1);
    },
    []
  );

  // Only show products that match the currentQueryKey (never flash stale items from a previous category)
  const products = cachedEntry ? cachedEntry.items : [];
  const totalItems = cachedEntry ? cachedEntry.total : 0;
  const totalPages = cachedEntry ? cachedEntry.totalPages : 1;
  const isLoadingCatalog = !cachedEntry && isSyncingApi;

  return {
    products,
    totalItems,
    totalPages,
    isSyncingApi,
    isLoadingCatalog,
    category,
    setCategory: handleSelectCategory,
    sort,
    setSort,
    sizes,
    toggleSize,
    maxPrice,
    setMaxPrice,
    page,
    setPage,
    filterOpen,
    setFilterOpen,
    categories: SHOP_CATEGORIES,
    clearFilters,
    applyFilters,
  };
}
