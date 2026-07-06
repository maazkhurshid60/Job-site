"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container, Button } from "./ui";
import { Logo } from "./Logo";

const links = [
  { label: "Home", href: "/" },
  { label: "Browse jobs", href: "/jobs" },
  { label: "How it works", href: "/#how" },
  { label: "For companies", href: "/#companies" },
  { label: "For recruiters", href: "/#recruiters" },
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
    <header className="sticky top-0 z-50 border-b border-line/70 bg-white/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* pill nav group */}
        <nav className="hidden items-center gap-1 rounded-full border border-line bg-cream/60 p-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink hover:bg-black/[0.04]"
          >
            Log in
          </Link>
          <Button href="/signup">Sign up</Button>
        </div>

        {/* mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full border border-line lg:hidden"
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
        <div className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive(l.href)
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-black/[0.03] hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-3">
              <Button href="/login" variant="outline" className="flex-1">
                Log in
              </Button>
              <Button href="/signup" className="flex-1">
                Sign up
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
