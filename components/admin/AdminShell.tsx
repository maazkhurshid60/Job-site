"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { adminRoutes } from "@/lib/routes";
import { Logo } from "@/components/Logo";

const groups = [
  {
    label: "Menu",
    items: [{ label: "Dashboard", href: adminRoutes.base, icon: "M3 9l7-6 7 6v8a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z" }],
  },
  {
    label: "Recruitment",
    items: [
      { label: "Jobs", href: adminRoutes.jobs, icon: "M3 6h14v11H3zM7 6V4h6v2" },
      { label: "Add new job", href: adminRoutes.newJob, icon: "M10 4v12M4 10h12" },
      { label: "Submissions", href: adminRoutes.submissions, icon: "M4 4h12v12H4zM7 8h6M7 11h6" },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");

  function isActive(href: string) {
    if (href === adminRoutes.base) return pathname === adminRoutes.base;
    if (href === adminRoutes.newJob) return pathname === adminRoutes.newJob;
    if (href === adminRoutes.jobs)
      return pathname.startsWith(adminRoutes.jobs) && pathname !== adminRoutes.newJob;
    return pathname.startsWith(href);
  }

  async function signOut() {
    await logout();
    router.replace(adminRoutes.login);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`${adminRoutes.jobs}?q=${encodeURIComponent(q)}`);
  }

  const initial = (user?.email ?? "A").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      {/* top header */}
      <header className="sticky top-0 z-40 flex h-16 items-center border-b border-line bg-white">
        <div className="flex h-full w-60 shrink-0 items-center border-r border-line px-5">
          <Logo />
        </div>
        <div className="flex flex-1 items-center gap-4 px-4 lg:px-6">
          <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 sm:block">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input h-10 pl-10"
              placeholder="Search jobs…"
            />
            <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </form>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href={adminRoutes.submissions}
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted hover:text-ink"
              aria-label="Submissions"
              title="Submissions"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14v10H3zM3 6l7 5 7-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="flex items-center gap-2 border-l border-line pl-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">
                {initial}
              </span>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-semibold text-ink">Admin</p>
                <p className="max-w-[160px] truncate text-xs text-muted">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-line px-3 py-5 md:flex">
          <div className="flex-1 space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {group.label}
                </p>
                <nav className="space-y-1">
                  {group.items.map((item) => (
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
                        <path d={item.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-black/[0.03] hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M8 4H4v12h4M13 13l3-3-3-3M16 10H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1">
          {/* mobile nav */}
          <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 md:hidden">
            {groups.flatMap((g) => g.items).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive(item.href) ? "bg-primary-soft text-primary" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button onClick={signOut} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-muted">
              Sign out
            </button>
          </div>

          <main className="p-6 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
