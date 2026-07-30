import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Search Playbooks — How We Fill Hard Engineering Roles",
  description:
    "How JobFolder approaches the engineering searches that stall elsewhere: PE-licensed design roles, state-certified CEI inspectors, cleared government engineers and senior structural hires.",
  keywords: [
    "engineering recruitment case studies",
    "hard to fill engineering roles",
    "DOT recruitment approach",
    "CEI inspector recruitment",
    "structural engineer search",
  ],
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: "Search Playbooks — How We Fill Hard Engineering Roles",
    description:
      "The approach behind the engineering searches that stall elsewhere — licensure, certification, geography and speed.",
    url: "/case-studies",
  },
};

/* Deliberately written as method, not as history. JobFolder has no
   client-approved placement stories to publish yet, and inventing them would
   put false claims on a live commercial site. Each playbook describes how the
   search type is actually run; the note at the foot of the page says plainly
   that named stories will replace this when clients approve them. */
const playbooks = [
  {
    label: "Transportation / DOT",
    title: "A PE-licensed roadway designer, in-state, on a letting deadline",
    problem:
      "A programme award creates demand for the same discipline across every consultant pursuing it, in the same state, at the same time. The licensed pool is small to begin with, and comity transfers between states take weeks the schedule does not have.",
    approach: [
      "Establish first whether the role genuinely requires a seal or whether an experienced designer working under a licensed engineer satisfies the scope — this alone often multiplies the addressable pool.",
      "Confirm which state's licence is required, and whether a comity application would land inside the project timeline, before any out-of-state candidate is progressed.",
      "Work the brief across recruiters who cover that specific state's design standards and CADD environment, rather than transportation generally.",
      "Screen on plan production to the state's manual, not on years of experience.",
    ],
  },
  {
    label: "CEI / Inspection",
    title: "State-certified inspectors, on site, at short notice",
    problem:
      "Inspection requirements surface late, are fixed to a location, and are gated by certifications specific to the state's own qualification programme. A well-credentialed inspector from a neighbouring state frequently cannot be assigned without additional coursework.",
    approach: [
      "Pin down the exact certifications the project requires — NICET subfield and level, ACI, IMSA, and the state's own programme — before sourcing begins.",
      "Treat the commuting radius as a hard constraint, and settle per diem and travel terms up front so they can be screened against rather than negotiated at offer.",
      "Draw on recruiters with existing regional inspection coverage, where knowing who is certified where is the entire value.",
      "Match the level to the decisions the role makes, not to a years-of-experience band.",
    ],
  },
  {
    label: "Structural",
    title: "A senior structural engineer where the qualified pool is countable",
    problem:
      "At principal level in a narrow speciality — bridge load rating, complex retrofit — the population of genuinely qualified people in a region can be small enough to list by name, and most of them are not looking.",
    approach: [
      "Map the market rather than source against it: identify the population, then approach it, because posting to a pool this size returns nothing.",
      "Be explicit that this is where a purely contingent model underperforms — the work is systematic identification, not sourcing volume.",
      "Handle the approach confidentially where the hire replaces an incumbent, or where the candidate is senior enough that discretion is a condition of engaging at all.",
    ],
  },
  {
    label: "Government / Cleared",
    title: "Cleared engineering roles where the clearance is the constraint",
    problem:
      "An active clearance requirement narrows the pool severely, and sponsoring a new one converts a six-week hire into a multi-month project. The requirement is frequently added to specs that do not actually need it.",
    approach: [
      "Challenge the requirement first: if the work does not need clearance at start, removing it is the single largest expansion of the pool available.",
      "Where it is genuinely required, treat active clearance as a hard filter and search only within it — a perfect candidate without one is not a candidate for that timeline.",
      "Build the full onboarding timeline, including background checks and project-specific training, into the offer conversation rather than discovering it afterwards.",
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
              Resources
            </span>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Search playbooks: how we fill the roles that stall
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              Engineering searches rarely fail on candidate quality. They fail on
              licensure that was never checked against the scope, a certification
              specific to one state&apos;s programme, a geography constraint
              treated as a preference, or a process slower than the market.
              Here&apos;s how we approach four search types where that happens
              most.
            </p>
          </Container>
        </section>

        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-3xl space-y-8">
              {playbooks.map((p) => (
                <article
                  key={p.title}
                  className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10"
                >
                  <span className="inline-block rounded-pill bg-blue-brand-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-brand">
                    {p.label}
                  </span>
                  <h2 className="mt-5 text-xl font-bold text-ink sm:text-2xl">
                    {p.title}
                  </h2>

                  <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted/70">
                    Why it stalls
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted">{p.problem}</p>

                  <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-muted/70">
                    How we run it
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {p.approach.map((a) => (
                      <li key={a} className="flex gap-3 text-muted">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-brand" />
                        <span className="leading-relaxed">{a}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}

              {/* Honest statement of what this page is and isn't. */}
              <div className="rounded-3xl border border-gray-200 bg-gray-50/60 p-8">
                <h2 className="text-lg font-bold text-ink">
                  About these playbooks
                </h2>
                <p className="mt-3 leading-relaxed text-muted">
                  These describe our approach to each type of search, not
                  specific engagements. We don&apos;t publish client names,
                  placement figures or outcome metrics without the client&apos;s
                  written approval — and until we have that approval, we&apos;d
                  rather show you the method than invent the results. Named case
                  studies will appear here as clients agree to them.
                </p>
              </div>

              <div className="rounded-3xl border border-blue-brand-light bg-blue-brand-soft p-8 text-center">
                <p className="text-lg font-bold text-ink">
                  Have a search that&apos;s stalled?
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                  Tell us the discipline, the licensure and the location.
                  We&apos;ll tell you honestly whether we can move it.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
                  >
                    Talk to us about hiring
                  </Link>
                  <Link
                    href="/hiring-guides"
                    className="inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
                  >
                    Read the hiring guides
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
