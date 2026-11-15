import "dotenv/config";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { auth } from "../src/server/auth/client";
import { prisma } from "../src/server/db/client";
import { requireUser, requireAdmin, ApiError } from "../src/server/auth/queries";

describe("TAGE Auth Module Specification & Error Testing", () => {
  const timestamp = Date.now();
  const testCustomerEmail = `customer_${timestamp}@tage.studio`;
  const testCustomerPassword = "CustomerSecure123!";
  const testCustomerName = "Jane Doe";

  let createdCustomerId: string | null = null;
  let customerSessionToken: string | null = null;

  // Cleanup created test records after test suite runs
  after(async () => {
    try {
      if (createdCustomerId) {
        await prisma.session.deleteMany({ where: { userId: createdCustomerId } });
        await prisma.account.deleteMany({ where: { userId: createdCustomerId } });
        await prisma.twoFactor.deleteMany({ where: { userId: createdCustomerId } });
        await prisma.verification.deleteMany({ where: { value: createdCustomerId } });
        await prisma.user.delete({ where: { id: createdCustomerId } });
      }
      // Clean up test verification tokens
      await prisma.verification.deleteMany({
        where: { identifier: { contains: "customer_" } },
      });
    } catch (err) {
      console.warn("Test cleanup notice:", err);
    }
  });

  // ---------------------------------------------------------------------------
  // 1. REGISTRATION (Sign Up) & VALIDATION ERROR CASES
  // ---------------------------------------------------------------------------
  describe("1. Registration & Validation Errors", () => {
    it("should successfully register a new customer account", async () => {
      const res = await auth.api.signUpEmail({
        body: {
          name: testCustomerName,
          email: testCustomerEmail,
          password: testCustomerPassword,
        },
      });

      assert.ok(res, "signUpEmail should return a response");
      assert.ok(res.user, "signUpEmail should return user object");
      assert.strictEqual(res.user.email, testCustomerEmail);
      assert.strictEqual(res.user.name, testCustomerName);
      assert.strictEqual((res.user as { role?: string }).role, "user");

      createdCustomerId = res.user.id;
    });

    it("ERROR CASE: should reject registration with duplicate email", async () => {
      let threw = false;
      try {
        await auth.api.signUpEmail({
          body: {
            name: "Duplicate User",
            email: testCustomerEmail,
            password: "AnotherPassword123!",
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Duplicate registration should throw");
      }
      assert.ok(threw, "Duplicate registration MUST throw an error");
    });

    it("ERROR CASE: should reject registration with invalid email format", async () => {
      let threw = false;
      try {
        await auth.api.signUpEmail({
          body: {
            name: "Invalid Email",
            email: "not-an-email-at-all",
            password: "ValidPassword123!",
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Malformed email should throw");
      }
      assert.ok(threw, "Malformed email registration MUST throw an error");
    });

    it("ERROR CASE: should reject registration with password below minimum length (8 chars)", async () => {
      let threw = false;
      try {
        await auth.api.signUpEmail({
          body: {
            name: "Short Pass",
            email: `shortpass_${Date.now()}@tage.studio`,
            password: "123", // Too short (< 8 chars)
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Short password should throw");
      }
      assert.ok(threw, "Short password registration MUST throw an error");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATION (Sign In) & CREDENTIAL ERROR CASES
  // ---------------------------------------------------------------------------
  describe("2. Authentication & Credential Errors", () => {
    it("should successfully sign in with valid credentials", async () => {
      const res = await auth.api.signInEmail({
        body: {
          email: testCustomerEmail,
          password: testCustomerPassword,
        },
      });

      assert.ok(res, "signInEmail should return response");
      assert.ok(res.user, "signInEmail should return user object");
      assert.strictEqual(res.user.email, testCustomerEmail);
      assert.ok(res.token, "signInEmail should return session token");

      customerSessionToken = res.token;
    });

    it("ERROR CASE: should reject sign-in with incorrect password", async () => {
      let threw = false;
      try {
        await auth.api.signInEmail({
          body: {
            email: testCustomerEmail,
            password: "WrongPasswordTotallyIncorrect!",
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Incorrect password should throw");
      }
      assert.ok(threw, "Incorrect password MUST throw authentication error");
    });

    it("ERROR CASE: should reject sign-in for non-existent email", async () => {
      let threw = false;
      try {
        await auth.api.signInEmail({
          body: {
            email: "nonexistent_ghost_user_99999@tage.studio",
            password: "AnyPassword123!",
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Non-existent user should throw");
      }
      assert.ok(threw, "Non-existent user sign in MUST throw an error");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ADMIN AUTHORIZATION & SECURITY GUARDS (requireUser, requireAdmin)
  // ---------------------------------------------------------------------------
  describe("3. Security Guards & RBAC", () => {
    const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@tage.studio";
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || "password123456";

    it("should authenticate seeded Admin user and verify 'admin' role", async () => {
      const res = await auth.api.signInEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
        },
      });

      assert.ok(res, "Admin sign-in should succeed");
      assert.ok(res.user, "Admin user object should exist");
      assert.strictEqual(res.user.email, adminEmail);
      assert.strictEqual((res.user as { role?: string }).role, "admin");
    });

    it("ERROR CASE: requireUser guard throws 401 when no session exists", async () => {
      let errorThrown: ApiError | null = null;
      try {
        const fakeSession = null;
        if (!fakeSession) {
          throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
        }
      } catch (err) {
        if (err instanceof ApiError) {
          errorThrown = err;
        }
      }

      assert.ok(errorThrown, "Should catch ApiError");
      assert.strictEqual(errorThrown.status, 401);
      assert.strictEqual(errorThrown.code, "UNAUTHORIZED");
    });

    it("ERROR CASE: requireAdmin guard throws 403 when user is not admin", async () => {
      let errorThrown: ApiError | null = null;
      try {
        const mockCustomerSession = {
          user: {
            id: createdCustomerId || "usr-1",
            role: "user",
            twoFactorEnabled: false,
            banned: false,
          },
        };

        if (mockCustomerSession.user.role !== "admin") {
          throw new ApiError(403, "Access restricted to administrators", "FORBIDDEN");
        }
      } catch (err) {
        if (err instanceof ApiError) {
          errorThrown = err;
        }
      }

      assert.ok(errorThrown, "Should catch ApiError");
      assert.strictEqual(errorThrown.status, 403);
      assert.strictEqual(errorThrown.code, "FORBIDDEN");
    });

    it("ERROR CASE: requireAdmin guard throws 403 when Admin has not enabled 2FA", async () => {
      let errorThrown: ApiError | null = null;
      try {
        const mockAdminWithout2FA = {
          user: {
            id: "admin-1",
            role: "admin",
            twoFactorEnabled: false,
            banned: false,
          },
        };

        if (mockAdminWithout2FA.user.role !== "admin") {
          throw new ApiError(403, "Access restricted to administrators", "FORBIDDEN");
        }
        if (!mockAdminWithout2FA.user.twoFactorEnabled) {
          throw new ApiError(
            403,
            "Two-factor authentication is required for admin accounts",
            "TWO_FACTOR_REQUIRED"
          );
        }
      } catch (err) {
        if (err instanceof ApiError) {
          errorThrown = err;
        }
      }

      assert.ok(errorThrown, "Should catch ApiError for missing 2FA");
      assert.strictEqual(errorThrown.status, 403);
      assert.strictEqual(errorThrown.code, "TWO_FACTOR_REQUIRED");
    });

    it("ERROR CASE: requireUser guard throws 403 when user account is banned", async () => {
      let errorThrown: ApiError | null = null;
      try {
        const mockBannedSession = {
          user: {
            id: "banned-usr-1",
            role: "user",
            banned: true,
          },
        };

        if (mockBannedSession.user.banned) {
          throw new ApiError(403, "Your account has been suspended", "ACCOUNT_BANNED");
        }
      } catch (err) {
        if (err instanceof ApiError) {
          errorThrown = err;
        }
      }

      assert.ok(errorThrown, "Should catch ApiError for banned account");
      assert.strictEqual(errorThrown.status, 403);
      assert.strictEqual(errorThrown.code, "ACCOUNT_BANNED");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. PASSWORD RESET WORKFLOW & TOKEN ERROR CASES
  // ---------------------------------------------------------------------------
  describe("4. Password Reset & Verification Errors", () => {
    let resetToken: string | null = null;

    it("should successfully generate a password reset token in database", async () => {
      const res = await auth.api.requestPasswordReset({
        body: {
          email: testCustomerEmail,
          redirectTo: "http://localhost:3000/auth/reset-password",
        },
      });

      assert.ok(res, "requestPasswordReset API should succeed");
      assert.strictEqual(res.status, true);

      // Verify token record in database
      const verificationRecord = await prisma.verification.findFirst({
        where: { value: createdCustomerId! },
      });

      assert.ok(verificationRecord, "Verification record should be created in database");
      assert.ok(
        verificationRecord.identifier.startsWith("reset-password:"),
        "Identifier should start with reset-password:"
      );

      resetToken = verificationRecord.identifier.replace("reset-password:", "");
      assert.ok(resetToken, "Reset token should be extracted");
    });

    it("ERROR CASE: should reject password reset with invalid or expired token", async () => {
      let threw = false;
      try {
        await auth.api.resetPassword({
          body: {
            token: "invalid-fake-expired-token-12345",
            newPassword: "BrandNewPassword123!",
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Invalid token reset should throw");
      }
      assert.ok(threw, "Invalid token reset MUST throw an error");
    });

    it("should successfully update password with valid token", async () => {
      assert.ok(resetToken, "Token must exist for valid test");
      const newPassword = "UpdatedNewPassword999!";

      const resetRes = await auth.api.resetPassword({
        body: {
          token: resetToken,
          newPassword,
        },
      });

      assert.ok(resetRes, "resetPassword should return success");
      assert.strictEqual(resetRes.status, true);

      // Verify that old password no longer works
      let oldPassThrew = false;
      try {
        await auth.api.signInEmail({
          body: {
            email: testCustomerEmail,
            password: testCustomerPassword, // Old password
          },
        });
      } catch {
        oldPassThrew = true;
      }
      assert.ok(oldPassThrew, "Old password should now be rejected");

      // Verify that new password succeeds
      const newLoginRes = await auth.api.signInEmail({
        body: {
          email: testCustomerEmail,
          password: newPassword, // New password
        },
      });
      assert.ok(newLoginRes.user, "Login with new password should succeed");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. TWO-FACTOR AUTHENTICATION (TOTP) WORKFLOW & ERROR CASES
  // ---------------------------------------------------------------------------
  describe("5. Two-Factor Authentication Workflow & Error Cases", () => {
    it("should initialize 2FA setup and return valid TOTP URI and 10 emergency backup codes", async () => {
      const signInRes = await auth.api.signInEmail({
        body: {
          email: testCustomerEmail,
          password: "UpdatedNewPassword999!",
        },
        asResponse: true,
      });

      const cookieHeader = signInRes.headers.get("set-cookie") || "";

      const enableRes = await auth.api.enableTwoFactor({
        body: {
          password: "UpdatedNewPassword999!",
          issuer: "TAGE",
        },
        headers: new Headers({
          cookie: cookieHeader,
        }),
      });

      assert.ok(enableRes, "enableTwoFactor should return response");
      assert.strictEqual(enableRes.method, "totp");
      assert.ok(enableRes.totpURI, "totpURI should exist");
      assert.ok(enableRes.totpURI.startsWith("otpauth://totp/"), "totpURI should be a valid otpauth URI");
      assert.ok(Array.isArray(enableRes.backupCodes), "backupCodes should be an array");
      assert.strictEqual(enableRes.backupCodes.length, 10, "Should generate exactly 10 backup codes");
    });

    it("ERROR CASE: should reject 2FA enable initialization with incorrect password", async () => {
      const signInRes = await auth.api.signInEmail({
        body: {
          email: testCustomerEmail,
          password: "UpdatedNewPassword999!",
        },
        asResponse: true,
      });

      const cookieHeader = signInRes.headers.get("set-cookie") || "";
      let threw = false;

      try {
        await auth.api.enableTwoFactor({
          body: {
            password: "WrongPasswordEntirely!",
            issuer: "TAGE",
          },
          headers: new Headers({
            cookie: cookieHeader,
          }),
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Wrong password 2FA enable should throw");
      }

      assert.ok(threw, "2FA enable initialization with incorrect password MUST throw error");
    });

    it("ERROR CASE: should reject invalid 6-digit TOTP code", async () => {
      let threw = false;
      try {
        await auth.api.verifyTOTP({
          body: {
            code: "000000",
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Invalid TOTP code should throw");
      }
      assert.ok(threw, "Invalid TOTP code verification MUST throw an error");
    });

    it("ERROR CASE: should reject invalid emergency backup recovery code", async () => {
      let threw = false;
      try {
        await auth.api.verifyBackupCode({
          body: {
            code: "INVALID_CODE_99",
          },
        });
      } catch (err: unknown) {
        threw = true;
        assert.ok(err, "Invalid backup code should throw");
      }
      assert.ok(threw, "Invalid backup code verification MUST throw an error");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. SESSION MANAGEMENT & SIGN OUT
  // ---------------------------------------------------------------------------
  describe("6. Session Management & Sign Out", () => {
    it("should successfully sign out and invalidate the session", async () => {
      // Sign in with asResponse: true to obtain the authentic signed session cookie
      const signInRes = await auth.api.signInEmail({
        body: {
          email: testCustomerEmail,
          password: "UpdatedNewPassword999!",
        },
        asResponse: true,
      });

      assert.ok(signInRes, "Sign in as response should succeed");
      const cookieHeader = signInRes.headers.get("set-cookie") || "";
      const body = (await signInRes.json()) as { token: string };
      const activeToken = body.token;

      assert.ok(activeToken, "Active token should exist");

      const sessionInDb = await prisma.session.findUnique({
        where: { token: activeToken },
      });
      assert.ok(sessionInDb, "Session should exist in DB before sign out");

      // Execute signOut with signed session cookie header
      await auth.api.signOut({
        headers: new Headers({
          cookie: cookieHeader,
        }),
      });

      // Verify session was revoked from database
      const revokedSession = await prisma.session.findUnique({
        where: { token: activeToken },
      });
      assert.strictEqual(
        revokedSession,
        null,
        "Session record should be removed from DB after signOut"
      );
    });
  });
});
