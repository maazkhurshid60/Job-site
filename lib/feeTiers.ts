/* Recruiter fee tiers — replaces freeform bounty amounts with a fixed,
   explainable 3-tier system. JobFolder sets the tier when a role is posted;
   the tier's dollar amount is what a recruiter earns on a confirmed hire.
   This is deliberately separate from what the employer pays JobFolder (that
   stays a private client-agreement matter) — see the tier picker in the
   admin JobWizard for the employer-facing side, and every recruiter-facing
   surface for this side.

   Existing jobs predating this system have `feeTier: null` and are left
   alone rather than auto-migrated to a tier — they simply show no fee badge
   until an admin sets one. */

export type FeeTier = "standard" | "professional" | "specialized";

export interface FeeTierMeta {
  value: FeeTier;
  amount: number;
  label: string;
  blurb: string;
}

export const FEE_TIERS: FeeTierMeta[] = [
  {
    value: "standard",
    amount: 1000,
    label: "Standard Search",
    blurb: "Good candidate availability, less specialized requirements, or higher-volume positions.",
  },
  {
    value: "professional",
    amount: 2000,
    label: "Professional Search",
    blurb: "Experienced professional positions requiring specific technical skills, licenses, industry experience, or geography.",
  },
  {
    value: "specialized",
    amount: 3000,
    label: "Specialized Search",
    blurb: "Highly specialized, difficult-to-fill, leadership, licensed engineering, defense, clearance, or other priority positions.",
  },
];

export function feeTierMeta(tier: string | null | undefined): FeeTierMeta | null {
  return FEE_TIERS.find((t) => t.value === tier) ?? null;
}

/** The dollar amount for a tier, or null when the job has no tier set. */
export function feeTierAmount(tier: string | null | undefined): number | null {
  return feeTierMeta(tier)?.amount ?? null;
}

export function formatFee(tier: string | null | undefined): string | null {
  const amount = feeTierAmount(tier);
  return amount === null ? null : `$${amount.toLocaleString()}`;
}
