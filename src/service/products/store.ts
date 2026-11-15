"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";
import { slugify } from "@/config/utils";
import { UpsertProductInput } from "./schema";

export interface ShopCatalogPageEntry {
  items: Product[];
  total: number;
  totalPages: number;
}

interface ProductStoreState {
  // Normalized product catalog cache (shared across Admin & Storefront)
  products: Product[];
  // Current paginated storefront view for customers (/shop)
  shopProducts: Product[];
  shopTotal: number;
  shopTotalPages: number;
  shopQueryKey: string;
  shopCatalogCache: Record<string, ShopCatalogPageEntry>;
  // Guest recently viewed IDs/slugs (persisted in localStorage)
  recentlyViewedIds: Array<number | string>;
  wishlistIds: Array<number | string>;
  // Admin search query (in-memory)
  searchQuery: string;

  // Store Actions
  setSearchQuery: (query: string) => void;
  setProducts: (products: Product[]) => void;
  setShopCatalog: (payload: {
    queryKey?: string;
    items: Product[];
    total: number;
    totalPages: number;
  }) => void;
  upsertProductDetail: (product: Product) => void;
  upsertProductsToCache: (items: Product[]) => void;
  addProduct: (input: UpsertProductInput | Product) => Product;
  updateProduct: (id: number | string, input: Partial<UpsertProductInput>) => void;
  updateVariantStock: (
    productId: number | string,
    variantId: string,
    stock: number
  ) => void;
  deleteProduct: (id: number | string) => void;
  addRecentlyViewed: (idOrSlug: number | string) => void;
  toggleWishlist: (id: number | string) => void;
  resetProducts: () => void;
}

function mergeProductList(existing: Product[], incoming: Product[]): Product[] {
  if (!incoming.length) return existing;
  const map = new Map<string, Product>();
  for (const p of existing) {
    map.set(p.slug, p);
  }
  for (const inc of incoming) {
    const prev = map.get(inc.slug);
    map.set(inc.slug, prev ? { ...prev, ...inc } : inc);
  }
  return Array.from(map.values());
}

export const useProductStore = create<ProductStoreState>()(
  persist(
    (set, get) => ({
      products: [],
      shopProducts: [],
      shopTotal: 0,
      shopTotalPages: 1,
      shopQueryKey: "",
      shopCatalogCache: {},
      recentlyViewedIds: [],
      wishlistIds: [],
      searchQuery: "",

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setProducts: (products) => set({ products }),

      setShopCatalog: ({ queryKey = "", items, total, totalPages }) =>
        set((state) => ({
          shopProducts: items,
          shopTotal: total,
          shopTotalPages: totalPages,
          shopQueryKey: queryKey,
          shopCatalogCache: queryKey
            ? {
                ...state.shopCatalogCache,
                [queryKey]: { items, total, totalPages },
              }
            : state.shopCatalogCache,
          products: mergeProductList(state.products, items),
        })),

      upsertProductDetail: (product) =>
        set((state) => ({
          products: mergeProductList(state.products, [product]),
          shopProducts: state.shopProducts.map((p) =>
            p.slug === product.slug || String(p.id) === String(product.id)
              ? { ...p, ...product }
              : p
          ),
        })),

      upsertProductsToCache: (items) =>
        set((state) => ({
          products: mergeProductList(state.products, items),
        })),

      addProduct: (input) => {
        if ("variants" in input) {
          const prod = input as Product;
          set((state) => ({
            products: [prod, ...state.products],
            shopCatalogCache: {},
          }));
          return prod;
        }
        const upsert = input as UpsertProductInput;
        const current = get().products;
        const nextId = current.length
          ? Math.max(
              ...current.map((p) => (typeof p.id === "number" ? p.id : 0))
            ) + 1
          : 1;
        const newProduct: Product = {
          id: nextId,
          slug: `${slugify(upsert.name)}-${nextId}`,
          name: upsert.name,
          color: upsert.color || "Standard",
          colorHex: upsert.colorHex || "#111111",
          price: upsert.price,
          originalPrice: upsert.originalPrice,
          costPrice: upsert.costPrice,
          category: upsert.category,
          sizes: upsert.sizes,
          images: upsert.images,
          temporaryImages: upsert.temporaryImages || [],
          isNew: upsert.isNew ?? true,
          isSale:
            upsert.isSale ??
            Boolean(
              upsert.originalPrice && upsert.originalPrice > upsert.price
            ),
          isSoldOut: upsert.isSoldOut ?? false,
          comboId: upsert.comboId,
          comboTitle: upsert.comboTitle,
          description:
            upsert.description ||
            "Relaxed, considered fit with clean finishing. Model is 183 cm and wears size M.",
          shippingAndReturns:
            "Flat rate shipping of $35. Returns are accepted only if the item arrives with incorrect measurements compared to the description, or color discrepancies compared to product photos. Return requests must be initiated within 7 days of delivery.",
          variants:
            upsert.variants ||
            upsert.sizes.map((size) => ({
              id: `var-${nextId}-${size}`,
              sku: `TG-FW26-${String(nextId).padStart(2, "0")}-${size}`,
              size,
              color: upsert.color || "Standard",
              colorHex: upsert.colorHex || "#111111",
              stock: upsert.isSoldOut ? 0 : 1,
              price: upsert.price,
            })),
          createdAt: new Date().toISOString(),
        };
        set({ products: [newProduct, ...current], shopCatalogCache: {} });
        return newProduct;
      },

      updateProduct: (id, input) => {
        set((state) => ({
          shopCatalogCache: {},
          products: state.products.map((p) => {
            if (p.id !== id) return p;
            const isSoldOut =
              input.isSoldOut !== undefined ? input.isSoldOut : p.isSoldOut;
            const updatedVariants = p.variants.map((v) => ({
              ...v,
              stock: isSoldOut ? 0 : v.stock > 0 ? v.stock : 1,
            }));
            return {
              ...p,
              ...input,
              isSoldOut,
              variants: input.variants || updatedVariants,
              slug:
                input.name && input.name !== p.name
                  ? `${slugify(input.name)}-${p.id}`
                  : p.slug,
            };
          }),
        }));
      },

      updateVariantStock: (productId, variantId, stock) => {
        set((state) => ({
          shopCatalogCache: {},
          products: state.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  variants: p.variants.map((v) =>
                    v.id === variantId
                      ? { ...v, stock: Math.max(0, stock) }
                      : v
                  ),
                }
              : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          shopProducts: state.shopProducts.filter((p) => p.id !== id),
          shopCatalogCache: {},
        }));
      },

      addRecentlyViewed: (idOrSlug) => {
        set((state) => {
          const key = String(idOrSlug);
          const filtered = state.recentlyViewedIds.filter(
            (x) => String(x) !== key
          );
          return { recentlyViewedIds: [idOrSlug, ...filtered].slice(0, 8) };
        });
      },

      toggleWishlist: (id) => {
        set((state) => ({
          wishlistIds: state.wishlistIds.includes(id)
            ? state.wishlistIds.filter((x) => x !== id)
            : [...state.wishlistIds, id],
        }));
      },

      resetProducts: () =>
        set({
          products: [],
          shopProducts: [],
          shopTotal: 0,
          shopTotalPages: 1,
          shopQueryKey: "",
          shopCatalogCache: {},
        }),
    }),
    {
      name: "tage-products-storage",
      version: 6,
      partialize: (state) => ({
        products: state.products,
        recentlyViewedIds: state.recentlyViewedIds,
        wishlistIds: state.wishlistIds,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version < 6) {
          const state = persistedState as Partial<ProductStoreState>;
          return {
            ...state,
            products: [],
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.products)) {
          state.products = state.products.map((p) => {
            const validImages =
              Array.isArray(p.images) && p.images.length > 0
                ? p.images.map((img) =>
                    typeof img === "string"
                      ? img.replace(/^\/?asset\/images\//, "/images/")
                      : "/images/products/p1-01.jpg"
                  )
                : ["/images/products/p1-01.jpg"];
            return { ...p, images: validImages };
          });
        }
      },
    }
  )
);
