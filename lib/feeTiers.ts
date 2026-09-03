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

export type FeeTier = "standard" | "general" | "professional" | "specialized";

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
    value: "general",
    amount: 1500,
    label: "General Search",
    blurb: "Roles where the client hasn't published a salary range. Our default fee until the role is triaged.",
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

/* Which tier a role lands in, from the salary the client published.
 *
 * Two things to know before changing the thresholds. They read salary_max
 * (the top of the range) because that's what signals seniority — a
 * 90k-160k posting is competing for the same people as a 150k one. And the
 * no-salary case is "general", not "standard": most roles here arrive with
 * no range at all, and defaulting them to the cheapest fee would advertise
 * $1,000 on work that is usually professional-level.
 *
 * This is only a starting point. An admin can move any job to another tier
 * in the wizard, and that choice survives re-imports. */
export function feeTierForSalary(
  salaryMin: number | null,
  salaryMax: number | null,
): FeeTier {
  const top = salaryMax ?? salaryMin;
  if (top === null) return "general";
  if (top < 120_000) return "standard";
  if (top < 170_000) return "professional";
  return "specialized";
}

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
