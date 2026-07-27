import type { ReactNode } from "react";

/* Shared content for the "How it works" section (components/HowItWorks.tsx)
   and its three dedicated pages (app/how-it-works/[slug]/page.tsx). Keeping
   it in one place means the cards and their detail pages never drift apart. */

export type HowStep = {
  slug: string;
  title: string;
  /** Short blurb shown on the home-page card. */
  summary: string;
  icon: ReactNode;
  /** Longer lead paragraph on the detail page. */
  intro: string;
  /** Body sections on the detail page. */
  sections: { heading: string; body: string }[];
  cta: { label: string; href: string };
};

const searchIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const referIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="m19 8 2 2 4-4" />
  </svg>
);

const earnIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export const howSteps: HowStep[] = [
  {
    slug: "browse-placements",
    title: "Browse Open Placements",
    summary:
      "Review our list of vetted civil, structural, manufacturing, and technical roles. Each job shows the precise requirements and the referral commission you can earn.",
    icon: searchIcon,
    intro:
      "Every role on JobFolder is a real, vetted placement from a hiring client — not a scraped listing or a dead posting. Browse the open board and see exactly what each client needs before you spend a minute on it.",
    sections: [
      {
        heading: "What you'll find",
        body: "Vetted civil, structural, bridge, manufacturing, and technical roles across the engineering disciplines our recruiters actively source for. Each listing shows the location, remote type, and the seniority the client is hiring at.",
      },
      {
        heading: "Everything up front",
        body: "Every job spells out the precise requirements, must-have qualifications and licenses, and the exact referral commission on offer — so you know the payout before you apply or refer.",
      },
      {
        heading: "Filter to your niche",
        body: "Narrow the board to the disciplines and locations you know best, so the roles you see are ones you can genuinely fill from yourself or your network.",
      },
    ],
    cta: { label: "Browse open roles", href: "/jobs" },
  },
  {
    slug: "refer-candidates",
    title: "Apply or Refer Candidates",
    summary:
      "Apply directly if you match the brief, or refer qualified professionals from your network by entering their details and uploading their CV.",
    icon: referIcon,
    intro:
      "There are two ways to win on JobFolder: put yourself forward for a role you fit, or refer someone great from your network and get credited as the referrer. Both take a couple of minutes.",
    sections: [
      {
        heading: "Apply directly",
        body: "If you match the brief, apply for the role yourself. Your details go straight to our principal recruiter for screening — no middle layers, no lost applications.",
      },
      {
        heading: "Refer from your network",
        body: "Know the right person? Enter their details and upload their CV, and you're locked in as the referrer on that candidate. If they get placed, the commission is yours.",
      },
      {
        heading: "We keep you in the loop",
        body: "Once a candidate is submitted, our recruiter handles screening and client coordination while you can follow the status — you'll know where every referral stands.",
      },
    ],
    cta: { label: "Find a role to refer for", href: "/jobs" },
  },
  {
    slug: "earn-commission",
    title: "Earn Referral Commission",
    summary:
      "Our principal recruiter screens candidates and coordinates with the client. When your referred candidate is selected and placed, you receive the success commission.",
    icon: earnIcon,
    intro:
      "Get paid when your referral gets placed. You bring the candidate; we handle the screening, the client relationship, and the placement — and you collect the success commission listed on the role.",
    sections: [
      {
        heading: "How the commission works",
        body: "Our principal recruiter screens your referred candidate and coordinates the whole process with the client. When that candidate is selected and placed, you receive the success commission shown on the listing.",
      },
      {
        heading: "Transparent bounties",
        body: "The referral commission is published on every single role, so there are never any surprises. You always know what a successful placement is worth before you refer.",
      },
      {
        heading: "No cost to take part",
        body: "It's free to join and free to refer. There are no retainers and no upfront fees — you only ever earn, never pay, to be part of the network.",
      },
    ],
    cta: { label: "Create your account", href: "/signup" },
  },
];

export function getStep(slug: string): HowStep | undefined {
  return howSteps.find((s) => s.slug === slug);
}
