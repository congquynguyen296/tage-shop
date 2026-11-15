const cookiePrefix = process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX || "tage";
const siteUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://localhost:3000";

export const AUTH_CONFIG = {
  baseUrl: siteUrl,
  trustedOrigins: Array.from(
    new Set(
      [
        siteUrl,
        process.env.NEXT_PUBLIC_SITE_URL,
        ...(process.env.AUTH_TRUSTED_ORIGINS?.split(",").map((s) => s.trim()) ||
          []),
        "http://localhost:3000",
      ].filter((origin): origin is string => Boolean(origin))
    )
  ),
  cookiePrefix,
  cookieName: `${cookiePrefix}.session_token`,
  secureCookieName: `__Secure-${cookiePrefix}.session_token`,
  tokenStorageKey: "tage-auth-storage",
  adminRole: process.env.AUTH_ADMIN_ROLE || "admin",
  customerRole: process.env.AUTH_CUSTOMER_ROLE || "user",
  issuer: process.env.NEXT_PUBLIC_SITE_NAME || "TAGE",
  enforceAdmin2FA: process.env.ENFORCE_ADMIN_2FA === "true",

  password: {
    minLength: Number(process.env.AUTH_MIN_PASSWORD_LENGTH || 8),
    maxLength: Number(process.env.AUTH_MAX_PASSWORD_LENGTH || 128),
    resetTokenExpiresIn: Number(
      process.env.AUTH_RESET_TOKEN_TTL_SECONDS || 3600
    ),
  },

  session: {
    expiresIn: Number(
      process.env.AUTH_SESSION_TTL_SECONDS || 60 * 60 * 24 * 7
    ), // 7 days Refresh Token
    updateAge: Number(
      process.env.AUTH_SESSION_UPDATE_AGE_SECONDS || 60 * 60 * 24
    ), // 24h auto-rotate
    freshAge: Number(process.env.AUTH_SESSION_FRESH_AGE_SECONDS || 60 * 15), // 15m freshness check
    accessTokenCacheMaxAge: Number(
      process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS || 60 * 5
    ), // 5m short-lived signed Access Token
  },

  rateLimit: {
    enabled: process.env.AUTH_RATE_LIMIT_ENABLED !== "false",
    window: Number(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS || 60),
    max: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
    signInMax: Number(process.env.AUTH_SIGN_IN_RATE_LIMIT_MAX || 5),
    passwordResetMax: Number(process.env.AUTH_RESET_RATE_LIMIT_MAX || 3),
    twoFactorMax: Number(process.env.AUTH_2FA_RATE_LIMIT_MAX || 5),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    enabled: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendApiUrl:
      process.env.RESEND_API_URL || "https://api.resend.com/emails",
    from: process.env.EMAIL_FROM || "TAGE Studio <noreply@tage.studio>",
  },

  demoAdminCredentials: {
    email:
      process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL ||
      process.env.ADMIN_SEED_EMAIL ||
      "admin@tage.studio",
    password:
      process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD ||
      process.env.ADMIN_SEED_PASSWORD ||
      "password123456",
  },
};
