"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui";
import { photo } from "./images";

/* Facts that are true by construction — no invented hire/candidate/volume
   metrics. Matches the same honesty stance the case-studies, press, and
   recruiters pages already take: nothing published here that isn't
   verifiably true of how JobFolder actually works today. */
const STATS: { value: string; label: string }[] = [
  { value: "$0", label: "Membership fees" },
  { value: "$1K–$3K", label: "Recruiter fee per hire" },
  { value: "Free", label: "To join and to refer" },
  { value: "Screened", label: "Every candidate, before the client sees them" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Navy photo banner — full-bleed, flush against the navbar above it.
          A duotone wash over a real interview photo reads as far more
          purpose-built than a flat gradient, while the overlay keeps the
          white headline text legible on top of it. */}
      <div className="relative">
        <div className="absolute inset-0">
          <Image
            src={photo.heroInterview.src}
            alt={photo.heroInterview.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-brand-dark/80 via-blue-brand-dark/65 to-blue-brand-dark/85" />
          {/* Blueprint-style grid — gives the navy wash some texture instead
              of reading as a flat tint over the photo. */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* Hero Content */}
        <Container className="relative z-10 px-6 pb-16 pt-20 text-center md:pb-24 md:pt-28">
          <div className="hero-rise mx-auto max-w-3xl">
            <span className="mb-6 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-white/15">
              No Membership Fee — Recruiter Network
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              The Smarter Way to
              <br className="hidden sm:block" />{" "}
              <span className="text-amber-400">Get Positions Filled</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-blue-100 md:text-xl">
              JobFolder connects experienced recruiters with active positions
              from hiring companies across every engineering discipline —
              earn $1,000–$3,000 per successful hire.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center rounded-full bg-amber-400 px-8 py-4 text-base font-bold text-blue-brand-dark transition-all duration-300 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-lg sm:w-auto"
              >
                Join as a Recruiter
              </Link>
              <Link
                href="/jobs"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/30 px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto"
              >
                Browse Open Positions
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-2 gap-y-8 border-t border-white/15 pt-10 sm:grid-cols-4 sm:gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-extrabold text-white sm:text-3xl">
                    {s.value}
                  </p>
                  <p className="mt-1.5 text-xs font-semibold text-blue-100/80 sm:text-sm">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
