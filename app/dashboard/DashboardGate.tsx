"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageLoader } from "@/components/Loader";

export default function DashboardGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, profile, profileLoading, profileError, refreshProfile, logout } =
    useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  /* Sign out before sending them to /signup or /login. Both pages bounce a
     signed-in visitor straight back here, so without this the buttons below
     would look like they do nothing. */
  async function goSignedOut(path: string) {
    await logout();
    router.replace(path);
  }
  const registerNewAccount = () => goSignedOut("/signup");
  const switchAccount = () => goSignedOut("/login");

  if (loading || !user || profileLoading) return <PageLoader />;

  /* The profile load failed rather than came back empty. Say so, and offer a
     retry — telling someone their account doesn't exist because the server
     hiccuped is both wrong and alarming. */
  if (profileError) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
          <h1 className="font-bold text-ink">Couldn&apos;t load your account</h1>
          <p className="mt-1 text-sm text-muted">
            You&apos;re still signed in as {user.email} — we just couldn&apos;t
            reach the server. Your account and submissions are safe.
          </p>
          <button
            type="button"
            onClick={() => refreshProfile()}
            className="mt-5 w-full rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Try again
          </button>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-muted hover:text-ink"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  /* Signed in, but this account has no recruiter profile. GET /api/me now
     creates one for any ordinary login, so in practice this is an admin-only
     account — which is a normal thing to be, not an error. Give it somewhere
     to go instead of a dead end. */
  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M19 8v6M22 11h-6" />
            </svg>
          </div>
          <h1 className="mt-4 font-bold text-ink">
            No recruiter account on this login
          </h1>
          <p className="mt-1 text-sm text-muted">
            {user.email} is signed in, but it isn&apos;t set up as a recruiter
            account — so there&apos;s no dashboard to show. Recruiter accounts
            are free, and you can register one in under a minute.
          </p>
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={registerNewAccount}
              className="block w-full rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Register a recruiter account
            </button>
            <button
              type="button"
              onClick={switchAccount}
              className="block w-full rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
            >
              Sign in with a different account
            </button>
          </div>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-muted hover:text-ink"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
