import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { AUTH_CONFIG } from "@/config/auth";
import { auth } from "./client";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Standard session getter:
 * Verifies the short-lived signed `tage.session_data` access token cookie,
 * and automatically refreshes via the `tage.session_token` refresh token in PostgreSQL when expired.
 */
export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
  });
});

/**
 * High-security session getter (bypasses cookie cache to check live DB state immediately).
 * Used for Admin mutations and sensitive operations.
 */
export const getFreshSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });
});

/**
 * Ensures the incoming request has a valid authenticated user session
 */
export async function requireUser() {
  const session = await getSession();
  if (!session || !session.user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  if (session.user.banned) {
    throw new ApiError(
      403,
      "Your account has been suspended",
      "ACCOUNT_BANNED"
    );
  }

  return session;
}

/**
 * Ensures the incoming request actor is an Admin (bypasses cookie cache to verify live DB session)
 */
export async function requireAdmin() {
  const session = await getFreshSession();
  if (!session || !session.user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  if (session.user.banned) {
    throw new ApiError(
      403,
      "Your account has been suspended",
      "ACCOUNT_BANNED"
    );
  }

  if (session.user.role !== AUTH_CONFIG.adminRole) {
    throw new ApiError(
      403,
      "Access restricted to administrators",
      "FORBIDDEN"
    );
  }

  if (AUTH_CONFIG.enforceAdmin2FA && !session.user.twoFactorEnabled) {
    throw new ApiError(
      403,
      "Two-factor authentication is required for admin accounts",
      "TWO_FACTOR_REQUIRED"
    );
  }

  return session;
}
