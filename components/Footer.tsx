"use client";

import Link from "next/link";
import { Container } from "./ui";
import { Logo } from "./Logo";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Browse jobs", href: "/jobs" },
      { label: "How it works", href: "/how-it-works" },
      { label: "For companies", href: "/#companies" },
      { label: "For recruiters", href: "/recruiters" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/#companies" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Hiring guides", href: "/hiring-guides" },
      { label: "Recruiter FAQ", href: "/recruiter-faq" },
      { label: "Search playbooks", href: "/case-studies" },
      { label: "Join the network", href: "/recruiters/apply" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookie policy", href: "/cookie-policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-blue-brand-dark pt-16 pb-10">

      {/* Brand wave accent at the bottom-right corner */}
      <div className="absolute -bottom-4 -right-16 h-36 w-64 pointer-events-none opacity-10">
        <svg viewBox="0 0 200 100" fill="none" className="text-lime fill-current w-full h-full">
          <path d="M0,80 C50,100 120,40 200,80 L200,100 L0,100 Z" />
        </svg>
      </div>

      <Container className="relative z-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo variant="onDark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              A crowdsourced recruiting agency. The reach of a network, the
              judgement of an agency — end to end.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-bold tracking-wider text-white uppercase">{col.heading}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/60 transition-colors duration-200 hover:text-lime"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/50 font-medium">
            © {new Date().getFullYear()} JobFolder. All rights reserved.
          </p>
          <div className="flex gap-3">
            {["in", "X", "f"].map((s) => (
              <span
                key={s}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/15 bg-white/5 text-sm font-bold text-white/70 hover:border-lime hover:text-lime hover:bg-lime/10 transition-all"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
