"use client";

import { useState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/auth/reset-password",
      });

      if (res.error) {
        setError(res.error.message || "Failed to dispatch reset link");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 border line">
      <div className="text-center mb-6">
        <h1 className="serif text-3xl mb-2">Reset Password</h1>
        <p className="mute text-xs">
          Enter your email to receive password reset instructions
        </p>
      </div>

      {sent ? (
        <div className="text-center py-6 space-y-4">
          <p className="text-sm">
            If an account matches <strong>{email}</strong>, a secure reset link has been dispatched.
          </p>
          <p className="text-xs mute">
            The link will expire in 1 hour. Please check your inbox or spam folder.
          </p>
          <Link href="/auth/login" className="btn text-xs inline-block">
            Return to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Email Address"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
            error={error || undefined}
          />

          <button
            type="submit"
            disabled={loading}
            className="btn w-full disabled:opacity-60"
          >
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>

          <div className="text-center pt-2">
            <Link href="/auth/login" className="mute text-xs underline">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
