"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth";
import { useNextPath } from "@/lib/useNextPath";
import { AuthCard, AuthField } from "@/components/auth/AuthCard";

/* Firebase deliberately returns the same `auth/invalid-credential` for a wrong
   password and an email with no account — that's its email-enumeration
   protection, and we shouldn't try to defeat it by guessing which happened.
   So the message covers both, and the sign-up prompt sits next to it. */
function loginErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/invalid-email") return "That email looks invalid.";
    if (err.code === "auth/user-disabled")
      return "This account has been disabled. Please contact us.";
    if (err.code === "auth/too-many-requests")
      return "Too many attempts. Wait a moment, then try again or reset your password.";
    if (err.code === "auth/network-request-failed")
      return "Couldn't reach the server. Check your connection and try again.";
  }
  return "We couldn't sign you in with those details.";
}

export default function LoginPage() {
  const router = useRouter();
  const nextPath = useNextPath();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(nextPath);
  }, [loading, user, router, nextPath]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(nextPath);
    } catch (err) {
      setError(loginErrorMessage(err));
      setSubmitting(false);
    }
  }

  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your JobFolder account."
      footer={
        <>
          New here?{" "}
          <Link href={signupHref} className="font-semibold text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@company.com"
          />
        </AuthField>
        <AuthField label="Password">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </AuthField>

        {error && (
          <div className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
            <p>{error}</p>
            <p className="mt-1 text-ink/70">
              Check your password, or{" "}
              <Link
                href={signupHref}
                className="font-semibold text-primary underline underline-offset-2"
              >
                create a free account
              </Link>{" "}
              if you haven&apos;t registered yet.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
