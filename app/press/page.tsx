import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { CONTACT_EMAIL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Press Kit & Media Enquiries",
  description:
    "Press resources for JobFolder — company boilerplate, what we do, brand assets, and media contact details for journalists covering engineering recruitment and infrastructure hiring.",
  keywords: [
    "JobFolder press kit",
    "media enquiries",
    "recruiting company boilerplate",
    "brand assets",
  ],
  alternates: { canonical: "/press" },
  openGraph: {
    title: "Press Kit & Media Enquiries",
    description:
      "Company boilerplate, brand assets and media contact details for JobFolder.",
    url: "/press",
  },
};

/* Everything here is factual: the boilerplate describes the model accurately,
   and the asset list points only at files that exist in /public. No founding
   date, funding, headcount or press coverage is claimed, because none of that
   is verified. */
const assets = [
  { label: "Logo — for light backgrounds (PNG)", href: "/jobfolder-logo.png" },
  { label: "Logo — for dark backgrounds (PNG)", href: "/jobfolder-logo-dark.png" },
];

const topics = [
  "Engineering talent shortages in transportation and infrastructure",
  "How PE licensure and state comity affect hiring timelines",
  "Staffing pressure created by public infrastructure funding cycles",
  "CEI and construction inspection workforce constraints",
  "Split-fee and crowdsourced recruiting versus traditional agency search",
];

export default function PressPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Press kit & media enquiries"
      intro="Everything a journalist covering engineering recruitment, infrastructure hiring or the staffing market needs to write about JobFolder accurately."
    >
      <InfoSection heading="Boilerplate — short">
        <p className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-ink">
          JobFolder is a crowdsourced recruiting agency for engineering,
          transportation and DOT hiring in the United States. It puts a network
          of specialist recruiters behind every role, screens every candidate
          in-house, and gives hiring clients a single point of contact until the
          hire is made.
        </p>
      </InfoSection>

      <InfoSection heading="Boilerplate — long">
        <p className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5 text-ink">
          JobFolder is a crowdsourced recruiting agency serving the United States
          engineering and infrastructure market, with a focus on civil,
          transportation and DOT, structural, MEP, water resources and CEI
          inspection roles. It combines two models that usually sit in
          opposition: the reach of a recruiter network, in which many specialists
          work the same brief in parallel, and the quality control of a
          traditional agency, in which every candidate is screened in-house
          before reaching the client. Recruiters in the network see the referral
          commission published on every role before they submit a candidate, and
          hiring clients pay only on a confirmed placement — there are no
          retainers or upfront fees on either side.
        </p>
      </InfoSection>

      <InfoSection heading="What JobFolder is — and isn't">
        <p>
          <strong className="text-ink">It is not a job board.</strong> Roles are
          live briefs from hiring clients, not aggregated or scraped listings.
        </p>
        <p>
          <strong className="text-ink">It is not an open marketplace.</strong>{" "}
          Clients never receive the unfiltered output of the network — every
          candidate is screened by JobFolder&apos;s own recruiters first.
        </p>
        <p>
          <strong className="text-ink">
            It is not a traditional single-desk agency.
          </strong>{" "}
          A role is worked by many specialist recruiters at once, rather than by
          one recruiter fitting it between other searches.
        </p>
      </InfoSection>

      <InfoSection heading="Brand assets">
        <p>
          Please use the supplied files rather than screenshots, and don&apos;t
          recolour, stretch or add effects to the logo.
        </p>
        <ul className="mt-4 space-y-2">
          {assets.map((a) => (
            <li key={a.href}>
              <a
                href={a.href}
                download
                className="inline-flex items-center gap-2 font-semibold text-blue-brand hover:underline"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                {a.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Need a vector file, a different format, or a higher resolution? Email
          us and we&apos;ll send it over.
        </p>
      </InfoSection>

      <InfoSection heading="Naming and style">
        <p>
          The company name is written{" "}
          <strong className="text-ink">JobFolder</strong> — one word, capital J
          and capital F, no space and no hyphen. Not &ldquo;Job Folder&rdquo;,
          &ldquo;Jobfolder&rdquo; or &ldquo;JOBFOLDER&rdquo; in running text.
        </p>
      </InfoSection>

      <InfoSection heading="Topics we can comment on">
        <p>
          We&apos;re happy to provide background, talk about what we see in our
          own market, or give an interview on any of the following:
        </p>
        <ul className="mt-3 space-y-2">
          {topics.map((t) => (
            <li key={t} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-brand" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection heading="Media contact">
        <p>
          For interviews, comment, or anything not covered above, email{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-semibold text-blue-brand hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          with &ldquo;Press&rdquo; in the subject line. We aim to respond within
          one business day — if you&apos;re on deadline, say so and we&apos;ll
          prioritise it.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
