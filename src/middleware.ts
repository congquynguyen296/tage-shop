import { NextRequest, NextResponse } from "next/server";
import { AUTH_CONFIG } from "@/config/auth";
import {
  APP_ROUTES,
  isLockedStorefrontRoute,
  STOREFRONT_LOCKED,
} from "@/config/routes";

interface CachedSessionPayload {
  session?: {
    user?: {
      role?: string;
      banned?: boolean;
    };
  };
}

/**
 * Inspect Better Auth's `tage.session_data` cookie payload at the Edge
 * to verify whether the current session belongs to an Administrator.
 * Returns:
 * - `"admin"` if role is explicitly admin
 * - `"non_admin"` if cookie payload is present and role is not admin (e.g. customer `"user"`)
 * - `"unknown"` if `session_data` cache cookie is expired/absent (will be verified by DB in Layout/API)
 */
function inspectEdgeSessionRole(
  request: NextRequest
): "admin" | "non_admin" | "unknown" {
  const rawDataCookie =
    request.cookies.get(AUTH_CONFIG.dataCookieName)?.value ||
    request.cookies.get(AUTH_CONFIG.secureDataCookieName)?.value;

  if (!rawDataCookie) {
    return "unknown";
  }

  try {
    const decoded = decodeURIComponent(rawDataCookie);
    const jsonText = atob(decoded.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(jsonText) as CachedSessionPayload;
    const role = parsed.session?.user?.role?.toLowerCase();
    const banned = parsed.session?.user?.banned;
    if (banned) {
      return "non_admin";
    }
    if (role === AUTH_CONFIG.adminRole.toLowerCase()) {
      return "admin";
    }
    if (role) {
      return "non_admin";
    }
  } catch {
    // Fall back to DB verification in AdminLayout & requireAdmin()
  }

  return "unknown";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken =
    request.cookies.get(AUTH_CONFIG.cookieName)?.value ||
    request.cookies.get(AUTH_CONFIG.secureCookieName)?.value;
  const edgeRole = inspectEdgeSessionRole(request);

  // 1. Always allow static curated customer showcase pages (/share/[code])
  if (
    pathname === APP_ROUTES.SHARE.PREFIX ||
    pathname.startsWith(`${APP_ROUTES.SHARE.PREFIX}/`)
  ) {
    return NextResponse.next();
  }

  // 2. Hide /admin/orders -> redirect to /admin/products
  if (
    pathname === APP_ROUTES.ADMIN.ORDERS ||
    pathname.startsWith(`${APP_ROUTES.ADMIN.ORDERS}/`)
  ) {
    return NextResponse.redirect(
      new URL(APP_ROUTES.ADMIN.PRODUCTS, request.url)
    );
  }

  // 3. Lock public web storefront routes when STOREFRONT_LOCKED is enabled
  if (STOREFRONT_LOCKED && isLockedStorefrontRoute(pathname)) {
    if (sessionToken && edgeRole !== "non_admin") {
      return NextResponse.redirect(
        new URL(APP_ROUTES.ADMIN.DASHBOARD, request.url)
      );
    }
    const loginUrl = new URL(APP_ROUTES.AUTH.LOGIN, request.url);
    loginUrl.searchParams.set("redirect", APP_ROUTES.ADMIN.DASHBOARD);
    if (edgeRole === "non_admin") {
      loginUrl.searchParams.set("reason", "admin_required");
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Protect Admin Studio routes (/admin/*) against unauthenticated users AND non-admin customers
  if (pathname.startsWith(APP_ROUTES.ADMIN.DASHBOARD)) {
    if (!sessionToken || edgeRole === "non_admin") {
      const loginUrl = new URL(APP_ROUTES.AUTH.LOGIN, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("reason", "admin_required");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|logo|video|favicon.ico).*)",
  ],
};
