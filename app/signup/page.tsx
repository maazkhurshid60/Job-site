"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth";
import { useNextPath } from "@/lib/useNextPath";
import { AuthCard, AuthField } from "@/components/auth/AuthCard";

function signupErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/email-already-in-use")
      return "An account with this email already exists.";
    if (err.code === "auth/weak-password")
      return "Password should be at least 6 characters.";
    if (err.code === "auth/invalid-email") return "That email looks invalid.";
  }
  return "Could not create your account. Please try again.";
}

export default function SignupPage() {
  const router = useRouter();
  const nextPath = useNextPath();
  const { user, loading, signup } = useAuth();

  const [name, setName] = useState("");
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
      await signup(email, password, { name });
      router.replace(nextPath);
    } catch (err) {
      setError(signupErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up to browse our jobs and submit your candidates."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Full name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Jordan Lee"
          />
        </AuthField>
        <AuthField label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@email.com"
          />
        </AuthField>
        <AuthField label="Password">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="At least 6 characters"
          />
        </AuthField>

        {error && (
          <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}
