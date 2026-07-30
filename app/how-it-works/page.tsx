import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { howSteps } from "@/lib/howItWorks";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How It Works — Crowdsourced Engineering Recruiting",
  description:
    "How JobFolder fills civil, transportation and DOT engineering roles: a network of specialist recruiters works every brief in parallel, we screen every candidate ourselves, and you pay only when the hire is made.",
  keywords: [
    "how crowdsourced recruiting works",
    "engineering recruiting process",
    "split fee recruiting network",
    "refer a candidate earn commission",
    "contingency engineering recruitment",
  ],
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: "How It Works — Crowdsourced Engineering Recruiting",
    description:
      "A network of specialist recruiters works every role in parallel. We screen every candidate. You pay only on the hire.",
    url: "/how-it-works",
  },
};

/* Two audiences land here, so the page answers both in sequence: clients first
   (they pay), then recruiters. The three `howSteps` are the recruiter journey
   and stay the canonical source — see lib/howItWorks.tsx. */
const clientSteps = [
  {
    heading: "1. You tell us the role",
    body: "A short brief — the discipline, the licensure, the location, the seniority. We turn it into a spec sharp enough that a specialist recruiter can act on it without a follow-up call, whether that's a PE-licensed roadway designer or a CEI inspector for a state DOT programme.",
  },
  {
    heading: "2. The network works it in parallel",
    body: "Instead of one recruiter on one desk, dozens of specialists source against your brief at the same time — each in the discipline and region they actually know. This is where a crowdsourced recruiting network beats a single agency on reach.",
  },
  {
    heading: "3. We screen before you see anyone",
    body: "Every referred candidate is vetted by our own recruiters against your spec. You never receive the raw output of a network — no spray-and-pray submissions, no unqualified profiles to wade through.",
  },
  {
    heading: "4. You interview a shortlist",
    body: "A curated shortlist in days rather than months, with one point of contact throughout. We coordinate every recruiter behind the scenes so you never manage more than one relationship.",
  },
  {
    heading: "5. You pay on the hire",
    body: "No retainer and no upfront cost. Our fee and the recruiter's referral commission are settled only once your new hire is confirmed — the contingency model, run across a whole network.",
  },
];

const faqs = [
  {
    question: "What is a crowdsourced recruiting agency?",
    answer:
      "It combines two models. A traditional agency puts one or two recruiters on your role and owns quality control. A marketplace gives you reach but hands you unfiltered submissions. JobFolder puts a whole network of specialist recruiters on the role for reach, then screens everything they produce so you get agency-grade quality on the way out.",
  },
  {
    question: "Which engineering disciplines do you recruit for?",
    answer:
      "Civil, transportation and DOT, structural, MEP, electrical, mechanical, water and hydrology, CEI and construction inspection, project management, and architecture across the AEC sector. We also cover software, DevOps, data and cleared government roles.",
  },
  {
    question: "How long does it take to get a shortlist?",
    answer:
      "Because sourcing runs in parallel across the network rather than sequentially through one desk, shortlists typically arrive in days rather than the weeks a single-desk search needs. The exact timeline depends on how specialised the licensure and location requirements are.",
  },
  {
    question: "What does it cost?",
    answer:
      "Nothing until you hire. There is no retainer and no upfront fee — our placement fee and the referring recruiter's commission are both settled only when your hire is confirmed.",
  },
];

export default function HowItWorksPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "How it works",
        item: absoluteUrl("/how-it-works"),
      },
    ],
  };

  return (
    <>
      <JsonLd schema={[faqSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
              How it works
            </span>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Crowdsourced engineering recruiting, with an agency doing the
              quality control
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              JobFolder puts a network of specialist recruiters behind every
              civil, transportation and DOT role, screens every candidate
              in-house, and keeps you with one point of contact until the hire is
              made. Here is exactly how that runs — for the companies hiring, and
              for the recruiters referring.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
              >
                Start hiring
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
              >
                Browse open roles
              </Link>
            </div>
          </Container>
        </section>

        {/* Client journey */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                For companies hiring
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                From brief to hire in five steps
              </h2>

              <ol className="mt-10 space-y-8">
                {clientSteps.map((s) => (
                  <li
                    key={s.heading}
                    className="border-l-2 border-blue-brand-light pl-6"
                  >
                    <h3 className="text-lg font-bold text-ink">{s.heading}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        {/* Recruiter journey — the three canonical steps */}
        <section className="border-t border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                For recruiters
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Refer a candidate, earn the commission
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Every role publishes its referral commission before you submit
                anyone. Free to join, no retainers, and you keep working the
                disciplines you already know.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {howSteps.map((s, i) => (
                <Link
                  key={s.slug}
                  href={`/how-it-works/${s.slug}`}
                  className="group relative rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-brand/20 hover:shadow-xl"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-brand-soft text-blue-brand transition-colors duration-300 group-hover:bg-blue-brand group-hover:text-white">
                    {s.icon}
                  </div>
                  <span className="absolute right-8 top-8 select-none text-4xl font-black text-gray-100 transition-colors duration-300 group-hover:text-blue-brand/10">
                    0{i + 1}
                  </span>
                  <h3 className="text-xl font-bold text-ink transition-colors group-hover:text-blue-brand">
                    {s.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {s.summary}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-1.5 pt-2 text-sm font-bold text-blue-brand">
                    Learn more
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ — mirrors the FAQPage schema above */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Common questions
              </h2>
              <dl className="mt-10 space-y-8">
                {faqs.map((f) => (
                  <div key={f.question}>
                    <dt className="text-lg font-bold text-ink">{f.question}</dt>
                    <dd className="mt-2 leading-relaxed text-muted">
                      {f.answer}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-14 rounded-3xl border border-blue-brand-light bg-blue-brand-soft p-8 text-center">
                <p className="text-lg font-bold text-ink">
                  Hiring engineers, or looking to refer them?
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
                  >
                    Talk to us about hiring
                  </Link>
                  <Link
                    href="/recruiters"
                    className="inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
                  >
                    Join the recruiter network
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
