"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth";
import { AuthCard, AuthField, RecruiterAside } from "@/components/auth/AuthCard";

function resetErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/invalid-email") return "That email looks invalid.";
    if (err.code === "auth/too-many-requests")
      return "Too many attempts. Wait a moment, then try again.";
    if (err.code === "auth/network-request-failed")
      return "Couldn't reach the server. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(email);
      /* Firebase doesn't say whether the email had an account — same
         enumeration protection as the login error, so this must show a
         success state either way rather than confirming who has an account. */
      setSent(true);
    } catch (err) {
      setError(resetErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      aside={
        <RecruiterAside
          eyebrow="Recruiter dashboard"
          headline="Your referrals, bounties, and briefs — all in one place."
          body="Sign in to track every candidate you've submitted, see where they stand, and pick up new roles worth referring into."
        />
      }
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-lg bg-sage-soft px-3 py-2 text-sm text-ink">
          If an account exists for <span className="font-semibold">{email}</span>,
          a reset link is on its way. Check your inbox (and spam folder), then
          follow the link to choose a new password.
        </div>
      ) : (
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

          {error && (
            <div className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
