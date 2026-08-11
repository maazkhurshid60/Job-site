import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { PageHero, PhotoBand } from "@/components/PageHero";
import { photo } from "@/components/images";
import { howSteps } from "@/lib/howItWorks";
import { absoluteUrl } from "@/lib/seo";
import { FEE_TIERS } from "@/lib/feeTiers";

const recruiterSteps = [
  { title: "Join JobFolder", body: "Recruiters create an account at no cost." },
  {
    title: "Browse Active Positions",
    body: "Choose from real recruiting assignments. Every position clearly shows the available recruiter fee: $1,000 | $2,000 | $3,000.",
  },
  {
    title: "Find a Qualified Candidate",
    body: "Recruit using your existing network, database, LinkedIn, referrals, or other sourcing methods.",
  },
  {
    title: "Submit Through JobFolder",
    body: "Upload the candidate's resume and required information. Your submission is timestamped to establish recruiter ownership.",
  },
  {
    title: "JobFolder Reviews the Candidate",
    body: "JobFolder checks the candidate against the position requirements before presenting them to the client.",
  },
  {
    title: "Client Interviews",
    body: "You can follow the candidate's progress through your dashboard.",
  },
  {
    title: "Candidate Gets Hired",
    body: "When your candidate successfully starts the position and satisfies the applicable placement terms, you earn $1,000, $2,000, or $3,000 — depending on the advertised recruiter fee for that position.",
  },
];

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
    body: "No retainer and no upfront cost. Our fee and the recruiter's success fee are settled only once your new hire is confirmed — the contingency model, run across a whole network.",
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
      "Nothing until you hire. There is no retainer and no upfront fee — our placement fee and the referring recruiter's success fee are both settled only when your hire is confirmed.",
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
        <PageHero
          eyebrow="How it works"
          title="Crowdsourced engineering recruiting, with an agency doing the quality control"
          lead="JobFolder puts a network of specialist recruiters behind every civil, transportation and DOT role, screens every candidate in-house, and keeps you with one point of contact until the hire is made. Here is exactly how that runs — for the companies hiring, and for the recruiters referring."
          photo={photo.civilEngineerWeir}
          actions={[
            { label: "Start hiring", href: "/contact" },
            { label: "Browse open roles", href: "/jobs" },
          ]}
        />

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

        <PhotoBand
          photo={photo.landSurveyor}
          caption="Every brief is worked by specialist recruiters who already know the discipline."
          className="pb-4"
        />

        {/* The 7-step recruiter process, spelled out literally */}
        <section className="border-t border-gray-100 py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                For recruiters
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Seven steps, start to paid
              </h2>
            </div>

            <ol className="mx-auto mt-12 max-w-2xl space-y-6">
              {recruiterSteps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-brand text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-ink">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* Why the fee varies by position */}
        <section className="border-t border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                Recruiter fee levels
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Why the fee varies by position
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                JobFolder determines the recruiter fee before the position
                becomes available to the recruiting network. The fee shown on
                the position is the fee the recruiter can earn.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {FEE_TIERS.map((t) => (
                <div key={t.value} className="rounded-2xl border border-gray-100 bg-white p-6">
                  <p className="text-2xl font-extrabold text-blue-brand">${t.amount.toLocaleString()}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{t.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t.blurb}</p>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted">
              There is no charge to join JobFolder. Recruiters are compensated
              only when their referred candidate is successfully placed.
            </p>
          </Container>
        </section>

        {/* Recruiter journey — the three canonical detail pages */}
        <section className="border-t border-gray-100 py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                Go deeper
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                Browse, submit, get paid
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Free to join, no retainers, and you keep working the
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
