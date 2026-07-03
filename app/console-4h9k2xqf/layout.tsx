"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { isAdminUser } from "@/lib/users";
import { adminRoutes } from "@/lib/routes";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/Loader";

function Gate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isLogin = pathname === adminRoutes.login;

  const [admin, setAdmin] = useState<"unknown" | "yes" | "no">("unknown");

  // Check the admin allow-list once we know who is signed in.
  useEffect(() => {
    let active = true;
    if (loading || !user) {
      setAdmin("unknown");
      return;
    }
    isAdminUser(user.uid)
      .then((ok) => active && setAdmin(ok ? "yes" : "no"))
      .catch(() => active && setAdmin("no"));
    return () => {
      active = false;
    };
  }, [loading, user]);

  // Route people who shouldn't be here away.
  useEffect(() => {
    if (loading || isLogin) return;
    if (!user) router.replace(adminRoutes.login);
    else if (admin === "no") router.replace("/");
  }, [loading, user, admin, isLogin, router]);

  // Login page renders on its own, without the admin chrome.
  if (isLogin) return <>{children}</>;

  if (loading || !user || admin !== "yes") {
    return <PageLoader />;
  }

  return <AdminShell>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Gate>{children}</Gate>;
}
