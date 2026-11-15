import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/server/db/client";
import { AUTH_CONFIG } from "@/config/auth";
import { sendAuthEmail } from "./actions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: AUTH_CONFIG.baseUrl,
  trustedOrigins: AUTH_CONFIG.trustedOrigins,

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: AUTH_CONFIG.password.minLength,
    maxPasswordLength: AUTH_CONFIG.password.maxLength,
    resetPasswordTokenExpiresIn: AUTH_CONFIG.password.resetTokenExpiresIn,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendAuthEmail({
        to: user.email,
        subject: `Reset your ${AUTH_CONFIG.issuer} account password`,
        text: `Please reset your password using the following link: ${url}`,
        html: `<p>Please reset your password using the following link:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  socialProviders: {
    ...(AUTH_CONFIG.google.enabled
      ? {
          google: {
            clientId: AUTH_CONFIG.google.clientId,
            clientSecret: AUTH_CONFIG.google.clientSecret,
            enabled: true,
            accessType: "offline",
            prompt: "select_account consent",
          },
        }
      : {}),
  },

  session: {
    expiresIn: AUTH_CONFIG.session.expiresIn,
    updateAge: AUTH_CONFIG.session.updateAge,
    freshAge: AUTH_CONFIG.session.freshAge,
    cookieCache: {
      enabled: true,
      maxAge: AUTH_CONFIG.session.accessTokenCacheMaxAge,
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: AUTH_CONFIG.cookiePrefix,
  },

  rateLimit: {
    enabled: AUTH_CONFIG.rateLimit.enabled,
    storage: "database",
    window: AUTH_CONFIG.rateLimit.window,
    max: AUTH_CONFIG.rateLimit.max,
    customRules: {
      "/sign-in/email": {
        window: AUTH_CONFIG.rateLimit.window,
        max: AUTH_CONFIG.rateLimit.signInMax,
      },
      "/request-password-reset": {
        window: AUTH_CONFIG.rateLimit.window,
        max: AUTH_CONFIG.rateLimit.passwordResetMax,
      },
      "/two-factor/verify": {
        window: AUTH_CONFIG.rateLimit.window,
        max: AUTH_CONFIG.rateLimit.twoFactorMax,
      },
    },
  },

  plugins: [
    admin({
      defaultRole: AUTH_CONFIG.customerRole,
      adminRoles: [AUTH_CONFIG.adminRole],
    }),
    twoFactor({
      issuer: AUTH_CONFIG.issuer,
    }),
    nextCookies(),
  ],
});
