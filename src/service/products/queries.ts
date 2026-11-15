import { ApiResponse, PaginatedResponse, Product } from "@/types";
import { API_ROUTES, SERVICE_CONSTANTS } from "@/config/routes";
import { ProductFilterInput, ProductFilterSchema } from "./schema";

/**
 * In-flight GET request deduplication map.
 * Prevents duplicate network requests when React StrictMode double-invokes useEffect on mount
 * or when multiple components request the same endpoint simultaneously.
 */
const inFlightGetRequests = new Map<string, Promise<unknown>>();

function fetchDedupedJson<T>(url: string): Promise<T> {
  const existing = inFlightGetRequests.get(url) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }

  const promise = fetch(url, {
    method: "GET",
    cache: "no-store",
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as T;
      setTimeout(() => {
        inFlightGetRequests.delete(url);
      }, SERVICE_CONSTANTS.DEDUPE_CACHE_TTL_MS);
      return data;
    })
    .catch((err) => {
      inFlightGetRequests.delete(url);
      throw err;
    });

  inFlightGetRequests.set(url, promise);
  return promise;
}

/**
 * Synchronous fallback filter & sort helper for instant paint before API resolves
 */
export function filterAndSortProducts(
  source: Product[],
  rawParams: Partial<ProductFilterInput>
): PaginatedResponse<Product> {
  const params = ProductFilterSchema.parse(rawParams);
  let filtered = [...source];

  if (
    params.category &&
    params.category !== "All" &&
    params.category !== "New Arrivals"
  ) {
    const catLower = params.category.toLowerCase();
    if (catLower === "top" || catLower === "tops") {
      filtered = filtered.filter((p) =>
        ["Tees", "Shirts", "Sweatshirt", "Knitwear", "Tops", "Top"].includes(
          p.category
        )
      );
    } else if (catLower === "bottom" || catLower === "bottoms") {
      filtered = filtered.filter((p) =>
        ["Bottoms", "Bottom", "Denim"].includes(p.category)
      );
    } else if (catLower === "outerwear") {
      filtered = filtered.filter((p) =>
        ["Outerwear", "Leather"].includes(p.category)
      );
    } else {
      filtered = filtered.filter((p) => p.category.toLowerCase() === catLower);
    }
  } else if (params.category === "New Arrivals") {
    filtered = filtered.filter((p) => p.isNew);
  }

  if (params.sizes && params.sizes.length > 0) {
    filtered = filtered.filter((p) =>
      p.sizes.some((s) => params.sizes.includes(s))
    );
  }

  if (typeof params.minPrice === "number") {
    filtered = filtered.filter((p) => p.price >= params.minPrice!);
  }

  if (typeof params.maxPrice === "number") {
    filtered = filtered.filter((p) => p.price <= params.maxPrice!);
  }

  if (params.q && params.q.trim() !== "") {
    const q = params.q.trim().toLowerCase();
    filtered = filtered.filter((p) =>
      `${p.name} ${p.color} ${p.category}`.toLowerCase().includes(q)
    );
  }

  if (params.sort === "lo") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (params.sort === "hi") {
    filtered.sort((a, b) => b.price - a.price);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);

  return {
    items,
    total,
    page,
    pageSize: params.pageSize,
    totalPages,
  };
}

/**
 * Fetch paginated & filtered products from PostgreSQL via `/api/products`
 */
export async function fetchProductsApi(
  rawParams: Partial<ProductFilterInput> = {}
): Promise<ApiResponse<PaginatedResponse<Product>>> {
  const params = ProductFilterSchema.parse(rawParams);
  const sp = new URLSearchParams();

  if (params.category && params.category !== "All") {
    sp.set("category", params.category);
  }
  if (params.sizes && params.sizes.length > 0) {
    sp.set("sizes", params.sizes.join(","));
  }
  if (typeof params.minPrice === "number") {
    sp.set("minPrice", String(params.minPrice));
  }
  if (typeof params.maxPrice === "number") {
    sp.set("maxPrice", String(params.maxPrice));
  }
  if (params.sort) {
    sp.set("sort", params.sort);
  }
  if (params.q && params.q.trim()) {
    sp.set("q", params.q.trim());
  }
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));

  return fetchDedupedJson<ApiResponse<PaginatedResponse<Product>>>(
    API_ROUTES.PRODUCTS.withQuery(sp.toString())
  );
}

/**
 * Fetch single product detail by slug or ID from `/api/products/[slug]`
 */
export async function fetchProductBySlugApi(
  slugOrId: string
): Promise<ApiResponse<Product | null>> {
  try {
    return await fetchDedupedJson<ApiResponse<Product | null>>(
      API_ROUTES.PRODUCTS.bySlug(slugOrId)
    );
  } catch {
    return {
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch curated shared product by shareCode from `/api/share/[code]`
 */
export async function fetchSharedProductApi(
  code: string
): Promise<ApiResponse<Product | null>> {
  try {
    return await fetchDedupedJson<ApiResponse<Product | null>>(
      API_ROUTES.SHARE.byCode(code)
    );
  } catch {
    return {
      success: false,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch similar / related products from `/api/products/[slug]/related`
 */
export async function fetchRelatedProductsApi(
  slugOrId: string
): Promise<ApiResponse<Product[]>> {
  try {
    return await fetchDedupedJson<ApiResponse<Product[]>>(
      API_ROUTES.PRODUCTS.relatedBySlug(slugOrId)
    );
  } catch {
    return {
      success: false,
      data: [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch recently viewed products:
 * - Logged-in users: fetched directly from PostgreSQL `recently_viewed_items`
 * - Guest users: hydrated from PostgreSQL using IDs/slugs saved in localStorage
 */
export async function fetchRecentlyViewedApi(options: {
  exclude?: string;
  guestIds?: Array<string | number>;
}): Promise<ApiResponse<Product[]>> {
  const sp = new URLSearchParams();
  if (options.exclude) {
    sp.set("exclude", options.exclude);
  }
  if (options.guestIds && options.guestIds.length > 0) {
    sp.set("ids", options.guestIds.map(String).join(","));
  }

  try {
    return await fetchDedupedJson<ApiResponse<Product[]>>(
      API_ROUTES.RECENTLY_VIEWED.withQuery(sp.toString())
    );
  } catch {
    return {
      success: false,
      data: [],
      timestamp: new Date().toISOString(),
    };
  }
}

const inFlightRecentlyViewedPost = new Map<string, Promise<void>>();

/**
 * Track a product view in DB (if user is logged in) or sync guest recently viewed IDs upon login.
 * Deduplicated per payload key while in-flight.
 */
export async function trackRecentlyViewedApi(
  itemId?: string,
  syncIds?: Array<string | number>
): Promise<void> {
  const payload = {
    itemId: itemId ? String(itemId) : undefined,
    syncIds: syncIds ? syncIds.map(String) : undefined,
  };
  const key = JSON.stringify(payload);
  const existing = inFlightRecentlyViewedPost.get(key);
  if (existing) {
    return existing;
  }

  const promise = fetch(API_ROUTES.RECENTLY_VIEWED.BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: key,
  })
    .then(() => undefined)
    .catch(() => {
      // Non-blocking telemetry
    })
    .finally(() => {
      setTimeout(() => {
        inFlightRecentlyViewedPost.delete(key);
      }, SERVICE_CONSTANTS.DEDUPE_CACHE_TTL_MS);
    });

  inFlightRecentlyViewedPost.set(key, promise);
  return promise;
}

/**
 * Live search products via `/api/products?q=...`
 */
export async function searchProductsApi(
  query: string
): Promise<ApiResponse<Product[]>> {
  const q = query.trim();
  if (!q) {
    return {
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const json = await fetchDedupedJson<
      ApiResponse<PaginatedResponse<Product>>
    >(API_ROUTES.PRODUCTS.search(q, SERVICE_CONSTANTS.SEARCH_DEFAULT_PAGE_SIZE));
    return {
      success: json.success,
      data: json.data?.items || [],
      timestamp: json.timestamp,
    };
  } catch {
    return {
      success: false,
      data: [],
      timestamp: new Date().toISOString(),
    };
  }
}

export function findProductSync(
  slugOrId: string | number,
  sourceProducts: Product[] = []
): Product | null {
  const key = String(slugOrId);
  return (
    sourceProducts.find(
      (p) =>
        String(p.id) === key ||
        p.slug === key ||
        (p.shareCode && p.shareCode === key)
    ) ||
    sourceProducts.find((p) => key.endsWith(`-${p.id}`)) ||
    null
  );
}
