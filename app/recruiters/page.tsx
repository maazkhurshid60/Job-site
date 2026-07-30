import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Split Fee Recruiting Network — Refer & Earn",
  description:
    "Join a split fee recruiting network built for engineering, transportation and DOT desks. Every role publishes its referral commission up front, it's free to join, and you never pay to take part — you only earn.",
  keywords: [
    "split fee recruiting network",
    "refer a candidate earn commission",
    "freelance recruiter jobs",
    "independent recruiter network",
    "recruiter referral commission",
    "split placement fees",
  ],
  alternates: { canonical: "/recruiters" },
  openGraph: {
    title: "Split Fee Recruiting Network — Refer & Earn",
    description:
      "Bring the candidates, we bring the roles. Every listing publishes its referral commission before you submit anyone.",
    url: "/recruiters",
  },
};

const benefits = [
  {
    title: "The commission is published up front",
    body: "Every role on the board shows its referral commission before you spend a minute on it. No negotiating a split after the fact, no discovering the fee was worth less than the work.",
  },
  {
    title: "Free to join, free to refer",
    body: "No membership fee, no retainer, no desk fee. There is no mechanism by which you pay JobFolder anything — money only moves in your direction, and only on a confirmed placement.",
  },
  {
    title: "You keep your niche",
    body: "Filter the board to the disciplines and states you actually know — DOT and transportation, structural, MEP, water resources, CEI inspection — so you only work roles you can genuinely fill.",
  },
  {
    title: "We own the client relationship",
    body: "Our principal recruiter handles screening, client coordination, scheduling and the close. You source; we run the process. No client management, no chasing feedback.",
  },
  {
    title: "Real roles, not scraped listings",
    body: "Every posting is a live brief from a hiring client. Nothing is aggregated from elsewhere, so you are never referring into a role that was filled three months ago.",
  },
  {
    title: "Your referral is locked in",
    body: "The moment you submit a candidate's details and CV, you are recorded as the referrer for that candidate. Ownership is unambiguous, so the commission is never in dispute.",
  },
];

const disciplines = [
  "Civil Engineering",
  "Transportation / DOT",
  "Structural Engineering",
  "MEP Engineering",
  "Water / Hydrology",
  "CEI / Inspection",
  "Project Management",
  "Architecture (AEC)",
  "Government / Cleared",
  "Software Engineering",
];

const steps = [
  {
    n: "01",
    title: "Join the network",
    body: "Apply in a couple of minutes. Tell us the disciplines and regions you cover so we can point the right roles at you.",
  },
  {
    n: "02",
    title: "Pick roles worth your time",
    body: "Browse open placements with the requirements, licensure and referral commission all visible before you commit.",
  },
  {
    n: "03",
    title: "Refer your candidate",
    body: "Enter their details, upload the CV, and you're locked in as the referrer. We take it from there.",
  },
  {
    n: "04",
    title: "Get paid on the placement",
    body: "When your candidate is selected and placed by the client, the published commission is yours.",
  },
];

export default function RecruitersPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "For recruiters",
        item: absoluteUrl("/recruiters"),
      },
    ],
  };

  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
              For recruiters
            </span>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              A split fee recruiting network for engineering and DOT desks
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              Bring the candidates, we bring the roles. JobFolder publishes the
              referral commission on every listing, screens and places the
              candidates you refer, and handles the client end from brief to
              offer — so you can spend your time doing the part you&apos;re good
              at.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/recruiters/apply"
                className="inline-flex items-center justify-center rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
              >
                Join the network
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
              >
                See open roles &amp; commissions
              </Link>
            </div>
          </Container>
        </section>

        {/* Why */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Why recruiters work with JobFolder
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Most split fee arrangements ask you to negotiate the fee after
                the placement and manage the client yourself. This one
                doesn&apos;t.
              </p>
            </div>

            <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => (
                <div key={b.title} className="group">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-brand-soft text-blue-brand transition-colors duration-300 group-hover:bg-blue-brand group-hover:text-white">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3 8l3 3 7-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Steps */}
        <section className="border-t border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                How referring works
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div
                  key={s.n}
                  className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm"
                >
                  <span className="text-3xl font-black text-gray-100 select-none">
                    {s.n}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Disciplines */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Disciplines we place
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Our board leans heavily into infrastructure and the built
                environment, with a technical and cleared-government stream
                alongside it.
              </p>
            </div>
            <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
              {disciplines.map((d) => (
                <span
                  key={d}
                  className="rounded-pill border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted"
                >
                  {d}
                </span>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-100 py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl rounded-3xl border border-blue-brand-light bg-blue-brand-soft p-10 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">
                Start earning on your network
              </h2>
              <p className="mx-auto mt-3 max-w-lg leading-relaxed text-muted">
                Free to join. Every role shows its commission before you refer.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/recruiters/apply"
                  className="inline-flex items-center justify-center rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
                >
                  Apply to join
                </Link>
                <Link
                  href="/recruiter-faq"
                  className="inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
                >
                  Read the recruiter FAQ
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
