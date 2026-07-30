import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { guides } from "@/lib/hiringGuides";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Hiring Guides — How to Hire Civil & DOT Engineers",
  description:
    "Practical guides to hiring engineering talent: PE licensure and when you actually need it, DOT prequalification and funding cycles, CEI inspection staffing, contingency vs retained search, and writing a job spec that fills.",
  keywords: [
    "how to hire civil engineers",
    "engineering hiring guide",
    "hiring engineers for DOT projects",
    "CEI inspection staffing",
    "contingency vs retained search",
    "engineering job description",
  ],
  alternates: { canonical: "/hiring-guides" },
  openGraph: {
    title: "Hiring Guides — How to Hire Civil & DOT Engineers",
    description:
      "Practical guides to hiring engineering talent — licensure, DOT programmes, inspection staffing and search models.",
    url: "/hiring-guides",
  },
};

export default function HiringGuidesPage() {
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "JobFolder hiring guides",
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: absoluteUrl(`/hiring-guides/${g.slug}`),
    })),
  };

  return (
    <>
      <JsonLd schema={listSchema} />
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
              Resources
            </span>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Hiring guides for engineering and DOT teams
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              Straightforward guidance on the things that decide whether an
              engineering search fills or stalls — licensure, discipline fit,
              prequalification, inspection certifications, and the fee models
              behind external recruitment.
            </p>
          </Container>
        </section>

        <section className="py-16 sm:py-20">
          <Container>
            <div className="grid gap-6 md:grid-cols-2">
              {guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/hiring-guides/${g.slug}`}
                  className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-brand/20 hover:shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                    {g.readingTime}
                  </span>
                  <h2 className="mt-3 text-xl font-bold text-ink transition-colors group-hover:text-blue-brand">
                    {g.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {g.summary}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-blue-brand">
                    Read the guide
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-blue-brand-light bg-blue-brand-soft p-8 text-center">
              <p className="text-lg font-bold text-ink">
                Rather have someone run the search?
              </p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
                Tell us the discipline, the licensure and the location.
                We&apos;ll put the network on it and screen everything before it
                reaches you.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
                >
                  Talk to us about hiring
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
                >
                  See how it works
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
