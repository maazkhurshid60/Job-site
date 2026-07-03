"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Container } from "@/components/ui";

const nav = [
  { label: "Overview", href: "/dashboard" },
  { label: "Browse jobs", href: "/jobs" },
  { label: "My submissions", href: "/dashboard/submissions" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-black/[0.03] hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted lg:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.replace("/");
              }}
              className="rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-black/[0.02]"
            >
              Sign out
            </button>
          </div>
        </Container>

        {/* mobile nav */}
        <div className="border-t border-line md:hidden">
          <Container className="flex gap-1 overflow-x-auto py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-primary-soft text-primary"
                    : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </div>
      </header>

      <main className="flex-1">
        <Container className="py-10">{children}</Container>
      </main>
    </div>
  );
}
