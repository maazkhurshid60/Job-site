"use client";

import { Container } from "./ui";
import { CountUp } from "./motion/CountUp";

const stats = [
  { to: 20, decimals: 0, suffix: "K", label: "Hires made" },
  { to: 1.3, decimals: 1, suffix: "M", label: "Candidates sourced" },
  { to: 8.5, decimals: 1, prefix: "$", suffix: "B", label: "In salaries placed" },
];

const companies = ["State DOTs", "Municipalities", "AEC Firms", "Design-Builders", "Public Agencies"];

export function SocialProof() {
  return (
    <section className="bg-white py-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
              About us
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Where great companies hire great people
            </h2>
            <p className="mt-4 text-base text-muted leading-relaxed">
              For decades, DOT agencies, municipalities, and AEC firms have leaned
              on JobFolder to fill their toughest engineering roles — without
              the noise of an open marketplace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 sm:gap-8 bg-gray-50/50 rounded-3xl border border-gray-100 p-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold text-blue-brand">
                  <CountUp
                    to={s.to}
                    decimals={s.decimals}
                    prefix={s.prefix}
                    suffix={s.suffix}
                  />
                </p>
                <p className="mt-2 text-xs sm:text-sm font-semibold text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sector ribbon — the kinds of teams JobFolder recruits for */}
        <div className="mt-16 border-t border-gray-100 pt-10">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted/60 mb-6">
            Trusted across DOT &amp; infrastructure teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-20">
            {companies.map((c) => (
              <span
                key={c}
                className="text-lg md:text-xl font-bold tracking-tight text-gray-400 hover:text-blue-brand transition-colors duration-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
