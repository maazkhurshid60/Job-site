"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui";
import { photo } from "./images";
import { CountUp } from "./motion/CountUp";

type Stat = {
  label: string;
  to?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  value?: string;
};

const STATS: Stat[] = [
  { to: 20, suffix: "K+", label: "Hires made" },
  { to: 1.3, decimals: 1, suffix: "M+", label: "Candidates sourced" },
  { to: 8.5, decimals: 1, prefix: "$", suffix: "B+", label: "Salaries placed" },
  { value: "$0", label: "Membership fees" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-6">
      {/* Navy photo banner — a duotone wash over a real interview photo reads
          as far more purpose-built than a flat gradient, while the overlay
          keeps the white headline text legible on top of it. */}
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-3xl md:rounded-[40px] shadow-2xl">
        <div className="absolute inset-0">
          <Image
            src={photo.heroInterview.src}
            alt={photo.heroInterview.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-brand-dark/95 via-blue-brand-dark/92 to-ink/95" />
          <div className="absolute inset-0 bg-blue-brand-dark/25 mix-blend-multiply" />
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
                    {s.value ?? (
                      <CountUp
                        to={s.to ?? 0}
                        decimals={s.decimals}
                        prefix={s.prefix}
                        suffix={s.suffix}
                      />
                    )}
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
