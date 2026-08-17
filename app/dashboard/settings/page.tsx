"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { user, emailVerified, resetPassword, logout } = useAuth();
  const [resetState, setResetState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResetPassword() {
    if (!user?.email) return;
    setResetState("sending");
    try {
      await resetPassword(user.email);
      setResetState("sent");
    } catch {
      setResetState("error");
    }
  }

  async function signOut() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Settings</h1>
        <p className="mt-0.5 text-xs text-muted">Manage your account and security.</p>
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Account</h2>
        <dl className="mt-3 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-ink">{user?.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Email verification</dt>
            <dd>
              {emailVerified ? (
                <span className="inline-flex rounded-pill bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
                  Verified
                </span>
              ) : (
                <span className="inline-flex rounded-pill bg-coral-soft px-2 py-0.5 text-[11px] font-semibold text-coral">
                  Not verified
                </span>
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-muted">
          To change your name, phone, company or other public details, use{" "}
          <Link href="/dashboard/profile" className="font-semibold text-primary hover:underline">
            My profile
          </Link>
          .
        </p>
      </section>

      <section className="mt-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Password</h2>
        <p className="mt-1.5 text-xs text-muted">
          We&apos;ll email a reset link to {user?.email ?? "your address"} — click it to choose a new password.
        </p>
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={resetState === "sending"}
          className="mt-3 rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {resetState === "sending" ? "Sending…" : "Send password reset email"}
        </button>
        {resetState === "sent" && (
          <p className="mt-2.5 rounded-lg bg-sage-soft px-3 py-2 text-xs text-ink">
            Reset link sent — check your inbox.
          </p>
        )}
        {resetState === "error" && (
          <p className="mt-2.5 rounded-lg bg-coral-soft px-3 py-2 text-xs text-coral">
            Couldn&apos;t send that right now. Try again shortly.
          </p>
        )}
      </section>

      <section className="mt-3 rounded-2xl border border-line bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Session</h2>
        <p className="mt-1.5 text-xs text-muted">Sign out of JobFolder on this device.</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
        >
          Sign out
        </button>
      </section>

      <section className="mt-3 rounded-2xl border border-coral/30 bg-coral-soft/40 p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-coral">Close your account</h2>
        <p className="mt-1.5 text-xs text-ink">
          We handle account closures by hand, to make sure any pending
          placements and fees are settled first.
        </p>
        <Link
          href="/contact?subject=Close my recruiter account"
          className="mt-3 inline-block rounded-pill border border-coral px-3.5 py-1.5 text-xs font-semibold text-coral hover:bg-coral hover:text-white"
        >
          Contact us
        </Link>
      </section>
    </div>
  );
}
