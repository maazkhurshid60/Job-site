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
    <section id="how" className="bg-gray-50/30 py-20 border-b border-gray-100">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            The reach of a marketplace, the judgement of an agency
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-brand/20"
            >
              {/* Icon Container */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-brand-soft mb-6 transition-colors duration-300 group-hover:bg-blue-brand group-hover:text-white text-blue-brand">
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {s.icon}
                </div>
              </div>

              {/* Step number badge */}
              <span className="absolute top-8 right-8 text-4xl font-black text-gray-100 select-none group-hover:text-blue-brand/10 transition-colors duration-300">
                0{i + 1}
              </span>

              <h3 className="text-xl font-bold text-ink group-hover:text-blue-brand transition-colors duration-200">
                {s.title}
              </h3>
              
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {s.body}
              </p>

              <div className="mt-6 pt-2">
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-brand hover:text-blue-brand-dark transition-colors"
                >
                  Learn more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
