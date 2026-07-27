"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./ui";
import { Logo } from "./Logo";

const links = [
  { label: "Home", href: "/" },
  { label: "Browse jobs", href: "/jobs" },
  { label: "How it works", href: "/#how" },
  { label: "Refer & Earn", href: "/#on-demand" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/jobs")) return pathname.startsWith("/jobs");
    return false;
  }

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
            <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 text-center rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-muted hover:bg-gray-50"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex-1 text-center rounded-full bg-blue-brand py-2.5 text-sm font-semibold text-white hover:bg-blue-brand-dark"
              >
                Sign up
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
