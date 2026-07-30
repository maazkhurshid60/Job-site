import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { CONTACT_EMAIL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Careers — Recruiting Jobs at JobFolder",
  description:
    "We don't have posted openings right now, but we always read speculative applications from recruiters with an engineering, transportation or DOT desk. Here's who tends to do well here and how to reach us.",
  keywords: [
    "careers at JobFolder",
    "recruiting jobs",
    "engineering recruiter jobs",
    "talent partner roles",
  ],
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers — Recruiting Jobs at JobFolder",
    description:
      "No posted openings right now, but we always read speculative applications from engineering and DOT recruiters.",
    url: "/careers",
  },
};

/* States plainly that there are no openings rather than implying a pipeline
   that doesn't exist. The roles below are the shapes we'd hire into, framed as
   "when we hire" — not as live vacancies. */
const roleShapes = [
  {
    title: "Specialist recruiters",
    body: "People with a real desk in one discipline — transportation and DOT, structural, MEP, water resources, or CEI inspection — who know the firms and the people in a region rather than working from a job board.",
  },
  {
    title: "Candidate screening",
    body: "The part of the model clients actually pay for. Reading a spec, reading a CV, and knowing whether an engineer licensed in a neighbouring state can realistically be on site by the letting date.",
  },
  {
    title: "Client-side account work",
    body: "Turning a vague requirement into a brief the network can act on, then staying the single point of contact through to offer.",
  },
  {
    title: "Product and engineering",
    body: "The platform is a Next.js and Firebase application. Occasional need for people who can build the job board, the recruiter dashboard, and the admin tooling behind them.",
  },
];

export default function CareersPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Careers at JobFolder"
      intro="We're building the reach of a recruiting network with the judgement of an agency — which means the people here have to be good at the judgement part."
    >
      <InfoSection heading="We don't have openings posted right now">
        <p>
          That&apos;s the honest position, and we&apos;d rather say it than list
          roles we aren&apos;t actively hiring for. When we do open something, it
          will be posted here and on our own job board.
        </p>
        <p>
          We do read every speculative application and keep good ones on file —
          several of the best conversations we&apos;ve had started with someone
          getting in touch before there was a role.
        </p>
      </InfoSection>

      <InfoSection heading="The kinds of people we hire">
        <div className="space-y-6">
          {roleShapes.map((r) => (
            <div key={r.title}>
              <h3 className="font-bold text-ink">{r.title}</h3>
              <p className="mt-1.5 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </InfoSection>

      <InfoSection heading="What working here actually involves">
        <p>
          We recruit for infrastructure — the roles that get roads designed,
          bridges inspected and public projects staffed. It&apos;s a market with
          real constraints: state licensure, certification programmes, funding
          cycles and construction schedules. People who enjoy it tend to be the
          ones who find those constraints interesting rather than annoying.
        </p>
        <p>
          The model also means we&apos;re not a volume shop. Our value to clients
          is that we filter, so nobody here is measured on submissions sent. That
          only works if the people doing the screening genuinely understand what
          they&apos;re screening.
        </p>
      </InfoSection>

      <InfoSection heading="Wanting to refer candidates, not join the team?">
        <p>
          That&apos;s a different thing, and it&apos;s open right now. The{" "}
          <Link
            href="/recruiters"
            className="font-semibold text-blue-brand hover:underline"
          >
            recruiter network
          </Link>{" "}
          is how independent and agency recruiters work our roles and earn the
          published referral commission — free to join, no retainers, and you
          keep your own desk. The{" "}
          <Link
            href="/recruiter-faq"
            className="font-semibold text-blue-brand hover:underline"
          >
            recruiter FAQ
          </Link>{" "}
          covers how the commission works.
        </p>
      </InfoSection>

      <InfoSection heading="Get in touch">
        <p>
          Email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-blue-brand hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          with &ldquo;Careers&rdquo; in the subject line. Tell us which
          disciplines you cover, which regions you know, and what you&apos;d want
          to be doing — that&apos;s more useful to us than a covering letter.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-pill bg-blue-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
          >
            Get in touch
          </Link>
          <Link
            href="/recruiters"
            className="inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
          >
            Join the recruiter network
          </Link>
        </div>
      </InfoSection>
    </InfoPage>
  );
}
