"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Button } from "./ui";
import { Logo } from "./Logo";

const links = [
  { label: "Browse jobs", href: "/jobs" },
  { label: "How it works", href: "/#how" },
  { label: "For companies", href: "/#companies" },
  { label: "For recruiters", href: "/#recruiters" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-cream/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-ink hover:text-primary"
          >
            Log in
          </Link>
          <Button href="/signup" variant="outline">
            Sign up
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden"
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
        <div className="border-t border-line bg-cream md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-muted hover:bg-black/[0.03] hover:text-ink"
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
