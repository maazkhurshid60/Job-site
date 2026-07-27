"use client";

import { Container } from "./ui";

export function EnterpriseService() {
  return (
    <section className="bg-white py-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30 p-8 sm:p-12 shadow-sm hover:shadow-md transition-shadow duration-300">
          
          {/* Decorative design bubbles */}
          <span className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-blue-100/50 blur-xl pointer-events-none" />
          <span className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-100/40 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                Enterprise Service
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                Let&apos;s grow your team together
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted leading-relaxed">
                No retainers and no upfront fees. JobFolder helps companies of
                all sizes hire — you only pay a success fee once the right candidate
                signs. Tell us your role and we&apos;ll handle candidate screening from there.
              </p>
            </div>
            
            <div className="flex shrink-0 items-center gap-3">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-blue-brand px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-brand-dark hover:-translate-y-0.5 hover:shadow-md"
              >
                Get Started
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-muted transition-all duration-200 hover:bg-gray-50 hover:border-gray-300"
              >
                Talk to us
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
