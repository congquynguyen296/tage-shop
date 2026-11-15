"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/service/auth/store";

function VerifyTwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin";

  const setUser = useAuthStore((s) => s.setUser);

  const [code, setCode] = useState("");
  const [isBackup, setIsBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (isBackup) {
        const res = await authClient.twoFactor.verifyBackupCode({
          code: code.trim(),
        });

        if (res.error) {
          setError(res.error.message || "Invalid backup code");
          setLoading(false);
          return;
        }

        if (res.data) {
          const authUser = res.data.user as { id: string; name: string; email: string; role?: string };
          setUser({
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            role: authUser.role === "admin" ? "admin" : "user",
            addresses: [],
          });
          router.push(redirectUrl);
          router.refresh();
        }
      } else {
        const res = await authClient.twoFactor.verifyTotp({
          code: code.trim(),
        });

        if (res.error) {
          setError(res.error.message || "Invalid authenticator code");
          setLoading(false);
          return;
        }

        if (res.data) {
          const authUser = res.data.user as { id: string; name: string; email: string; role?: string };
          setUser({
            id: authUser.id,
            name: authUser.name,
            email: authUser.email,
            role: authUser.role === "admin" ? "admin" : "user",
            addresses: [],
          });
          router.push(redirectUrl);
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 border line">
      <div className="text-center mb-6">
        <h1 className="serif text-3xl mb-2">Two-Factor Authentication</h1>
        <p className="mute text-xs">
          {isBackup
            ? "Enter one of your 10-character emergency backup recovery codes"
            : "Enter the 6-digit verification code from your authenticator app"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label={isBackup ? "Backup Code" : "Authenticator Code"}
          value={code}
          onChange={setCode}
          placeholder={isBackup ? "e.g. A1B2C3D4E5" : "000000"}
          type="text"
          error={error || undefined}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn w-full disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Confirm & Proceed"}
        </button>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              setIsBackup(!isBackup);
              setCode("");
              setError(null);
            }}
            className="text-xs mute hover:text-[color:var(--fg)] underline"
          >
            {isBackup
              ? "Use Authenticator app (TOTP) instead"
              : "Lost phone? Use an emergency backup code"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyTwoFactorPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 mute">Loading...</div>}>
      <VerifyTwoFactorForm />
    </Suspense>
  );
}

