/**
 * Centralized API Route Constants, Dynamic Endpoint Builders, Storage Keys & Service Types
 * Eliminates hardcoded endpoint strings across `src/service/*` and `src/app/api/*`.
 */

export const API_ENDPOINTS = {
  AUTH_BASE: "/api/auth",
  AUTH_SESSION: "/api/auth/get-session",
  PRODUCTS: "/api/products",
  RECENTLY_VIEWED: "/api/recently-viewed",
  SHARE_BASE: "/api/share",
  CART: "/api/cart",
  ADMIN_PRODUCTS: "/api/admin/products",
  UPLOAD: "/api/upload",
} as const;

export type ApiEndpointPath =
  (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

/**
 * Strongly-typed API route builders used across `src/service/*`
 */
export const API_ROUTES = {
  AUTH: {
    BASE: API_ENDPOINTS.AUTH_BASE,
    SESSION: API_ENDPOINTS.AUTH_SESSION,
  },
  PRODUCTS: {
    BASE: API_ENDPOINTS.PRODUCTS,
    withQuery: (queryString: string) =>
      queryString
        ? `${API_ENDPOINTS.PRODUCTS}?${queryString}`
        : API_ENDPOINTS.PRODUCTS,
    bySlug: (slugOrId: string | number) =>
      `${API_ENDPOINTS.PRODUCTS}/${encodeURIComponent(String(slugOrId))}`,
    relatedBySlug: (slugOrId: string | number) =>
      `${API_ENDPOINTS.PRODUCTS}/${encodeURIComponent(
        String(slugOrId)
      )}/related`,
    search: (query: string, pageSize: number = 12) =>
      `${API_ENDPOINTS.PRODUCTS}?q=${encodeURIComponent(
        query
      )}&pageSize=${pageSize}`,
  },
  SHARE: {
    BASE: API_ENDPOINTS.SHARE_BASE,
    byCode: (code: string) =>
      `${API_ENDPOINTS.SHARE_BASE}/${encodeURIComponent(code)}`,
  },
  RECENTLY_VIEWED: {
    BASE: API_ENDPOINTS.RECENTLY_VIEWED,
    withQuery: (queryString: string) =>
      queryString
        ? `${API_ENDPOINTS.RECENTLY_VIEWED}?${queryString}`
        : API_ENDPOINTS.RECENTLY_VIEWED,
  },
  CART: {
    BASE: API_ENDPOINTS.CART,
    withQuery: (queryString: string) =>
      queryString ? `${API_ENDPOINTS.CART}?${queryString}` : API_ENDPOINTS.CART,
    removeItem: (itemIdOrSlug: string | number) =>
      `${API_ENDPOINTS.CART}?itemId=${encodeURIComponent(
        String(itemIdOrSlug)
      )}`,
    CLEAR_ALL: `${API_ENDPOINTS.CART}?clearAll=true`,
  },
  ADMIN: {
    PRODUCTS: API_ENDPOINTS.ADMIN_PRODUCTS,
    deleteProduct: (productId: string | number) =>
      `${API_ENDPOINTS.ADMIN_PRODUCTS}?id=${encodeURIComponent(
        String(productId)
      )}`,
  },
  UPLOAD: {
    BASE: API_ENDPOINTS.UPLOAD,
  },
} as const;

/**
 *PATCH operation modes for `/api/admin/products`
 */
export const ADMIN_PRODUCT_PATCH_MODES = {
  UPDATE: "update",
  STOCK: "stock",
  SHARE: "share",
} as const;

export type AdminProductPatchMode =
  (typeof ADMIN_PRODUCT_PATCH_MODES)[keyof typeof ADMIN_PRODUCT_PATCH_MODES];

/**
 * Zustand persisted localStorage keys across `src/service/<module>/store.ts`
 */
export const SERVICE_STORAGE_KEYS = {
  AUTH: "tage-auth-storage",
  CART: "tage-cart-storage",
  PRODUCTS: "tage-products-storage",
  ORDERS: "tage-orders-storage",
} as const;

export type ServiceStorageKey =
  (typeof SERVICE_STORAGE_KEYS)[keyof typeof SERVICE_STORAGE_KEYS];

/**
 * Cart & Order domain constants used in `src/service/cart` and `src/service/orders`
 */
export const SERVICE_CONSTANTS = {
  DEFAULT_PROMO_CODE: "TAGE10",
  DEFAULT_PROMO_DISCOUNT_RATE: 0.1,
  ORDER_NUMBER_PREFIX: "TG",
  MAX_RECENTLY_VIEWED_GUEST: 8,
  SEARCH_DEFAULT_PAGE_SIZE: 12,
  DEDUPE_CACHE_TTL_MS: 250,
} as const;

/**
 * Application page routes across Storefront, Static Share Showcase, Auth, and Admin Studio
 */
export const APP_ROUTES = {
  STOREFRONT: {
    HOME: "/",
    SHOP: "/shop",
    PRODUCT_PREFIX: "/product",
    CART: "/cart",
    CHECKOUT: "/checkout",
    ACCOUNT: "/account",
  },
  SHARE: {
    PREFIX: "/share",
    byCode: (code: string) => `/share/${encodeURIComponent(code)}`,
  },
  AUTH: {
    PREFIX: "/auth",
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_2FA: "/auth/verify-2fa",
  },
  ADMIN: {
    DASHBOARD: "/admin",
    PRODUCTS: "/admin/products",
    productDetail: (id: string | number) =>
      `/admin/products/${encodeURIComponent(String(id))}`,
    ORDERS: "/admin/orders",
    CUSTOMERS: "/admin/customers",
    SECURITY: "/admin/security",
  },
} as const;

/**
 * Feature flag to lock the public web storefront while keeping `/admin/*` and `/share/[code]` active.
 * Defaults to `true` unless `NEXT_PUBLIC_STOREFRONT_LOCKED="false"`.
 */
export const STOREFRONT_LOCKED =
  process.env.NEXT_PUBLIC_STOREFRONT_LOCKED !== "false";

/**
 * Checks whether a pathname is blocked when `STOREFRONT_LOCKED` is enabled.
 * Uses a strict WHITELIST so ONLY `/admin/*`, `/share/*`, and Admin Auth routes
 * (`/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-2fa`) are accessible.
 * Any other route (including `/`, `/shop`, `/dashboard/*`, etc.) is redirected to `/admin`.
 */
export function isLockedStorefrontRoute(pathname: string): boolean {
  // 1. Allow static curated customer showcase (/share/[code])
  if (
    pathname === APP_ROUTES.SHARE.PREFIX ||
    pathname.startsWith(`${APP_ROUTES.SHARE.PREFIX}/`)
  ) {
    return false;
  }

  // 2. Allow Admin Studio (/admin and /admin/*)
  if (
    pathname === APP_ROUTES.ADMIN.DASHBOARD ||
    pathname.startsWith(`${APP_ROUTES.ADMIN.DASHBOARD}/`)
  ) {
    return false;
  }

  // 3. Allow Admin authentication routes (except public customer registration)
  const allowedAuthRoutes: string[] = [
    APP_ROUTES.AUTH.LOGIN,
    APP_ROUTES.AUTH.FORGOT_PASSWORD,
    APP_ROUTES.AUTH.RESET_PASSWORD,
    APP_ROUTES.AUTH.VERIFY_2FA,
  ];
  if (
    allowedAuthRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return false;
  }

  // Block all other routes (Storefront, cached external paths like /dashboard/*, etc.)
  return true;
}

