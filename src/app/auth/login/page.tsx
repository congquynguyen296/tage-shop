"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { useAuthStore } from "@/service/auth/store";
import { useCartStore } from "@/service/cart/store";
import { useProductStore } from "@/service/products/store";
import { trackRecentlyViewedApi } from "@/service/products/queries";
import { LoginSchema } from "@/service/auth/schema";
import { APP_ROUTES, STOREFRONT_LOCKED } from "@/config/routes";
import { signIn, signOut } from "@/lib/auth-client";
import { markUserSessionSynced } from "@/hooks/useAuthSync";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRedirect = STOREFRONT_LOCKED
    ? APP_ROUTES.ADMIN.DASHBOARD
    : APP_ROUTES.STOREFRONT.HOME;
  const redirectUrl = searchParams.get("redirect") || defaultRedirect;
  const reason = searchParams.get("reason");

  const setUser = useAuthStore((s) => s.setUser);
  const syncWithServer = useCartStore((s) => s.syncWithServer);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (res.error) {
        setErrors({ form: res.error.message || "Invalid email or password" });
        setLoading(false);
        return;
      }

      if (res.data) {
        const authUser = res.data.user as {
          id: string;
          name: string;
          email: string;
          role?: string;
        };
        const isAdminRole = authUser.role?.toLowerCase() === "admin";

        // Enforce Admin privilege when storefront is locked or redirecting to /admin
        if ((STOREFRONT_LOCKED || redirectUrl.startsWith("/admin")) && !isAdminRole) {
          await signOut().catch(() => {});
          setUser(null);
          setErrors({
            form: "Access denied: Administrator privileges are required to sign in to the Admin Console.",
          });
          setLoading(false);
          return;
        }

        setUser({
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          role: isAdminRole ? "admin" : "user",
          addresses: [],
        });

        // Mark session synced so useAuthSync in Header does not re-trigger a 2nd sync
        markUserSessionSynced(authUser.id);
        await syncWithServer(true);
        const guestRecentIds = useProductStore.getState().recentlyViewedIds;
        if (guestRecentIds.length > 0) {
          trackRecentlyViewedApi(undefined, guestRecentIds);
        }

        router.push(isAdminRole && STOREFRONT_LOCKED ? APP_ROUTES.ADMIN.DASHBOARD : redirectUrl);
      }
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Authentication failed" });
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 border line">
      <div className="text-center mb-6">
        <h1 className="serif text-3xl mb-2">Sign In</h1>
        <p className="mute text-xs">Enter your details to access your account</p>
      </div>

      {reason === "admin_required" && (
        <div className="mb-6 p-3 bg-neutral-900 text-white text-xs text-center">
          Admin privilege required to access /admin.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Email Address"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
          error={errors.email}
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          error={errors.password}
        />

        <div className="flex justify-between items-center text-xs">
          <Link
            href="/auth/forgot-password"
            className="mute hover:text-[color:var(--fg)] underline"
          >
            Forgot password?
          </Link>
        </div>

        {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn h-[48px] w-full flex items-center justify-center disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t line" />
          </div>
          <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider mute">
            Or continue with
          </span>
        </div>

        <button
          type="button"
          onClick={async () => {
            const isAdminTarget =
              STOREFRONT_LOCKED ||
              redirectUrl.startsWith("/admin") ||
              reason === "admin_required";

            if (isAdminTarget) {
              setErrors({
                form: "Google Sign-In is disabled for Admin Console. Please sign in with your Admin email and password.",
              });
              return;
            }

            await signIn.social({
              provider: "google",
              callbackURL: redirectUrl,
            });
          }}
          className="h-[48px] w-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 flex items-center justify-center gap-2.5 text-xs uppercase tracking-[0.2em] font-medium transition-all"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>
      </form>

      {!STOREFRONT_LOCKED && (
        <div className="mt-6 text-center text-xs mute">
          Don’t have an account?{" "}
          <Link
            href="/auth/register"
            className="text-[color:var(--fg)] underline"
          >
            Create one
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 mute">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

