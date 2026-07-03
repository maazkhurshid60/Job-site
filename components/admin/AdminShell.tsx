"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { adminRoutes } from "@/lib/routes";
import { Logo } from "@/components/Logo";

const nav = [
  { label: "Jobs", href: adminRoutes.base, icon: "M3 4h14M3 9h14M3 14h9" },
  {
    label: "Submissions",
    href: adminRoutes.submissions,
    icon: "M4 4h12v12H4zM7 8h6M7 11h6",
  },
  { label: "Post a job", href: adminRoutes.newJob, icon: "M10 4v12M4 10h12" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-cream">
      {/* sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const active =
              item.href === adminRoutes.base
                ? pathname === adminRoutes.base
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-black/[0.03] hover:text-ink"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d={item.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-3 text-xs text-muted">{user?.email}</p>
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace(adminRoutes.login);
            }}
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
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6 md:hidden">
          <Logo />
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace(adminRoutes.login);
            }}
            className="text-sm font-semibold text-muted"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
