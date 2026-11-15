"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing from the URL. Please re-open the link from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (res.error) {
        setError(res.error.message || "Failed to reset password. The token may have expired.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 border line">
      <div className="text-center mb-6">
        <h1 className="serif text-3xl mb-2">Set New Password</h1>
        <p className="mute text-xs">Enter your new secure password below</p>
      </div>

      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
            Password reset successfully! Redirecting you to sign in...
          </div>
          <Link href="/auth/login" className="btn text-xs inline-block">
            Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="New Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="Min 8 characters"
            error={error || undefined}
          />

          <Field
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            type="password"
            placeholder="Re-type new password"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn w-full disabled:opacity-60"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>

          <div className="text-center pt-2">
            <Link href="/auth/login" className="mute text-xs underline">
              Return to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 mute">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

