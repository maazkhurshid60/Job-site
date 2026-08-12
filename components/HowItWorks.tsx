"use client";

import Link from "next/link";
import { Container } from "./ui";
import { howSteps } from "@/lib/howItWorks";

const steps = howSteps.map((s) => ({
  title: s.title,
  body: s.summary,
  icon: s.icon,
  href: `/how-it-works/${s.slug}`,
}));

export function HowItWorks() {
  return (
    <section id="how" className="bg-white py-20 border-b border-gray-100">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            A simple, transparent process that turns your network into commission.
          </p>
        </div>

        <div className="relative grid gap-y-14 gap-x-8 sm:grid-cols-3">
          {/* Connector line — sits behind the numbered circles on desktop,
              where there's room for the process to read left-to-right. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-17 hidden h-px bg-gray-200 sm:block"
            style={{ marginInline: `${100 / steps.length / 2}%` }}
          />

          {steps.map((s, i) => (
            <Link
              key={s.title}
              href={s.href}
              className="group relative flex flex-col items-center text-center"
            >
              <span className="text-sm font-black tracking-wide text-blue-brand">
                {String(i + 1).padStart(2, "0")}
              </span>

              <span className="relative mt-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-brand-soft bg-white text-blue-brand shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-brand group-hover:bg-blue-brand group-hover:text-white group-hover:shadow-lg">
                {s.icon}
              </span>

              <h3 className="mt-5 text-base font-extrabold uppercase tracking-wide text-ink transition-colors group-hover:text-blue-brand">
                {s.title}
              </h3>

              <p className="mt-3 max-w-60 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
