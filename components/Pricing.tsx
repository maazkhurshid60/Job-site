"use client";

import { Container } from "./ui";

export function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20 border-b border-gray-100">
      <Container>
        <div className="mx-auto max-w-2xl text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
            Flexible Collaboration
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Choose the offering that works best for you
          </h2>
          <p className="mt-4 text-sm text-muted">
            Whether you are looking to source candidate details or looking to hire top-tier professionals, we have you covered.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Card 1: For Recruiters (Standard Card) */}
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-gray-200 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <span className="inline-block rounded-full bg-gray-50 px-3.5 py-1 text-xs font-bold text-gray-600">
                  For Recruiters
                </span>
                <p className="mt-4 text-2xl font-extrabold text-ink">Submit & Earn</p>
                <p className="mt-2 text-sm text-muted">Earn bounties by submitting great candidates.</p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                  Top advantages
                </p>
                <ul className="space-y-4">
                  {recruitersChecklist.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-brand-soft text-blue-brand">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3 3 7-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-sm text-muted font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50">
              <a
                href="/recruiters/apply"
                className="block text-center rounded-full border border-gray-200 bg-transparent py-3 text-sm font-semibold text-muted hover:border-blue-brand hover:text-blue-brand hover:bg-blue-brand-soft/20 transition-all duration-200"
              >
                Join the Network
              </a>
            </div>
          </div>

          {/* Card 2: For Companies (Highlighted Blue Card) */}
          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-b from-blue-50/50 to-white p-8 shadow-md hover:shadow-2xl hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            {/* Highlight ribbon */}
            <div className="absolute top-0 right-0 bg-blue-brand text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
              Success Basis
            </div>

            <div>
              <div className="mb-6">
                <span className="inline-block rounded-full bg-blue-brand text-white px-3.5 py-1 text-xs font-bold">
                  For Companies
                </span>
                <p className="mt-4 text-2xl font-extrabold text-ink">Success-based hiring</p>
                <p className="mt-2 text-sm text-muted font-medium">Pay only success fees, zero upfront cost.</p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-brand mb-4">
                  Top advantages
                </p>
                <ul className="space-y-4">
                  {companiesChecklist.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-brand text-white">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3 3 7-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-sm text-gray-700 font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <a
                href="/signup"
                className="block text-center rounded-full bg-blue-brand py-3 text-sm font-semibold text-white hover:bg-blue-brand-dark shadow-sm hover:shadow-md transition-all duration-200"
              >
                Start Hiring
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

const recruitersChecklist = [
  "Earn a competitive split on confirmed hires",
  "Vetted, funded roles with clear specifications",
  "We handle client relationships and billing",
  "Dedicated portal for candidate updates",
  "Prompt payouts upon successful confirmation",
];

const companiesChecklist = [
  "A curated shortlist in days, not months",
  "Single point of contact from intro to signed offer",
  "Pay success fees only when candidate joins",
  "Full screen compliance and background check",
  "Expert brief drafting assistance for your team",
];
