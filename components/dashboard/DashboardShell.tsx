"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { listOpenJobs } from "@/lib/jobs";
import { profileCompletion } from "@/lib/profileCompletion";

const nav = [
  { label: "Overview", href: "/dashboard", icon: "M4 9l6-5 6 5v7H4z" },
  { label: "Browse jobs", href: "/jobs", icon: "M3 5h14M3 10h14M3 15h9" },
  {
    label: "My submissions",
    href: "/dashboard/submissions",
    icon: "M6 3h6l4 4v10H6zM12 3v4h4",
  },
  {
    label: "My profile",
    href: "/dashboard/profile",
    icon: "M10 10a3 3 0 100-6 3 3 0 000 6zM4 17a6 6 0 0112 0z",
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuth();

  /* How many roles are open right now, for the "Browse jobs" badge. Null until
     it's known — a badge reading "0" while still loading would tell recruiters
     there's no work, which is the one wrong thing it could say. */
  const [openJobs, setOpenJobs] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    listOpenJobs()
      .then((jobs) => active && setOpenJobs(jobs.length))
      .catch(() => {}); // a missing badge is fine; a broken sidebar is not
    return () => {
      active = false;
    };
  }, []);

  const completion = profileCompletion(profile);

  function badgeFor(href: string): string | null {
    if (href === "/jobs") return openJobs === null ? null : String(openJobs);
    if (href === "/dashboard/profile" && !completion.isComplete)
      return `${completion.percent}%`;
    return null;
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  async function signOut() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-black/[0.03] hover:text-ink"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path
                  d={item.icon}
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {item.label}
              {badgeFor(item.href) && (
                <span
                  className={`ml-auto rounded-pill px-2 py-0.5 text-xs font-bold tabular-nums ${
                    item.href === "/dashboard/profile"
                      ? "bg-coral-soft text-coral"
                      : "bg-primary-soft text-primary"
                  }`}
                >
                  {badgeFor(item.href)}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-3 text-xs text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-black/[0.03] hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M8 4H4v12h4M13 13l3-3-3-3M16 10H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-5 md:hidden">
          <Logo />
          <button
            type="button"
            onClick={signOut}
            className="text-sm font-semibold text-muted"
          >
            Sign out
          </button>
        </header>
        {/* mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-primary-soft text-primary"
                  : "text-muted"
              }`}
            >
              {item.label}
              {badgeFor(item.href) && (
                <span
                  className={`rounded-pill px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                    item.href === "/dashboard/profile"
                      ? "bg-coral-soft text-coral"
                      : "bg-primary-soft text-primary"
                  }`}
                >
                  {badgeFor(item.href)}
                </span>
              )}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
