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
  const { user, loading, profile, profileLoading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || profileLoading) return <PageLoader />;

  // Signed in but no self-serve profile (e.g. an admin-only account).
  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6">
        <div className="max-w-sm rounded-2xl border border-line bg-white p-8 text-center">
          <h1 className="font-bold text-ink">No account profile found</h1>
          <p className="mt-1 text-sm text-muted">
            This login isn&apos;t set up as a company or recruiter account.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-primary"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
