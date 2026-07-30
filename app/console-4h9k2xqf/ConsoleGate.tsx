"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { adminRoutes } from "@/lib/routes";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/Loader";

function Gate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  /* isAdmin now arrives with the profile from /api/me — no separate lookup.
     This gate is convenience only: it hides the UI. The actual enforcement is
     requireAdmin() on every /api/admin route, which a client cannot bypass. */
  const { user, loading, isAdmin, profileLoading } = useAuth();

  // Login + the temporary setup page render on their own (no admin gate).
  const isPublic =
    pathname === adminRoutes.login || pathname === adminRoutes.setup;

  const resolving = loading || (Boolean(user) && profileLoading);

  // Route people who shouldn't be here away.
  useEffect(() => {
    if (resolving || isPublic) return;
    if (!user) router.replace(adminRoutes.login);
    else if (!isAdmin) router.replace("/");
  }, [resolving, user, isAdmin, isPublic, router]);

  // Login + setup pages render on their own, without the admin chrome.
  if (isPublic) return <>{children}</>;

  if (resolving || !user || !isAdmin) {
    return <PageLoader />;
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function ConsoleGate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Gate>{children}</Gate>;
}
