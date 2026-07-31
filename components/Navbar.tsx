"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Container } from "./ui";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { adminRoutes } from "@/lib/routes";

const links = [
  { label: "Home", href: "/" },
  { label: "Browse jobs", href: "/jobs" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Refer & Earn", href: "/recruiters" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, profile, isAdmin, logout } = useAuth();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/jobs")) return pathname.startsWith("/jobs");
    return false;
  }

  async function signOut() {
    setOpen(false);
    await logout();
    router.replace("/");
  }

  /* Admins land in the console, recruiters in their dashboard — sending an
     admin to /dashboard would only bounce them off a gate they can't pass. */
  const homeHref = isAdmin ? adminRoutes.base : "/dashboard";
  const initial = (profile?.name || user?.displayName || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between gap-4">
        <Logo />

        {/* nav group */}
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold transition-colors duration-200 ${
                isActive(l.href)
                  ? "text-blue-brand"
                  : "text-muted hover:text-blue-brand"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {/* Nothing renders until auth resolves — flashing "Log in" at someone
              who is already signed in is worse than a beat of empty space. */}
          {loading ? (
            <span className="h-10 w-40" aria-hidden />
          ) : user ? (
            <>
              <button
                type="button"
                onClick={signOut}
                className="text-sm font-semibold text-muted transition-colors hover:text-blue-brand"
              >
                Sign out
              </button>
              <Link
                href={homeHref}
                className="flex items-center gap-2.5 rounded-full bg-blue-brand py-1.5 pl-2 pr-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-brand-dark hover:shadow-md"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 text-xs font-bold">
                  {profile?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photoURL}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </span>
                {isAdmin ? "Console" : "Dashboard"}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-muted hover:text-blue-brand transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-blue-brand px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-brand-dark hover:shadow-md"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full border border-gray-200 lg:hidden hover:bg-gray-50"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d={open ? "M3 3l12 12M15 3L3 15" : "M2 5h14M2 9h14M2 13h14"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </Container>

      {open && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted hover:bg-blue-brand-soft hover:text-blue-brand"
              >
                {l.label}
              </Link>
            ))}
            {!loading && (
              <div className="mt-2 flex gap-3 border-t border-gray-100 pt-2">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex-1 rounded-full border border-gray-200 py-2.5 text-center text-sm font-semibold text-muted hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                    <Link
                      href={homeHref}
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-full bg-blue-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-brand-dark"
                    >
                      {isAdmin ? "Console" : "Dashboard"}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-full border border-gray-200 py-2.5 text-center text-sm font-semibold text-muted hover:bg-gray-50"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="flex-1 rounded-full bg-blue-brand py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-brand-dark"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}
