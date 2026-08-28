import type { RecruiterSite } from "./recruiterSite";

/* How filled-in a recruiter's own website is — separate from profile
 * completion (lib/profileCompletion.ts), which is about their JobFolder
 * account. This is about the extra content the site itself renders: stats,
 * expertise, work history and the rest are all optional (the site still
 * falls back to the profile for name/photo/bio), but a site with none of
 * them filled in is just a name on a page, so it's worth surfacing. */

export type SiteField = {
  key: string;
  label: string;
  filled: (site: RecruiterSite) => boolean;
};

export const SITE_FIELDS: SiteField[] = [
  { key: "tagline", label: "Tagline", filled: (s) => Boolean(s.tagline.trim()) },
  { key: "intro", label: "About", filled: (s) => Boolean(s.intro.trim()) },
  { key: "stats", label: "Hero stats", filled: (s) => s.stats.length > 0 },
  { key: "expertise", label: "Core expertise", filled: (s) => s.expertise.length > 0 },
  { key: "experience", label: "Work history", filled: (s) => s.experience.length > 0 },
  { key: "specialisms", label: "Specialisms", filled: (s) => s.specialisms.length > 0 },
  { key: "highlights", label: "Track record highlights", filled: (s) => s.highlights.length > 0 },
  { key: "cta", label: "Contact button", filled: (s) => Boolean(s.ctaLabel.trim() && s.ctaUrl.trim()) },
];

export type SiteCompletion = {
  filled: number;
  total: number;
  /** 0–100, rounded. */
  percent: number;
  missing: SiteField[];
  isComplete: boolean;
};

export function siteCompletion(site: RecruiterSite | null): SiteCompletion {
  const total = SITE_FIELDS.length;
  if (!site) {
    return { filled: 0, total, percent: 0, missing: SITE_FIELDS, isComplete: false };
  }
  const missing = SITE_FIELDS.filter((f) => !f.filled(site));
  const filled = total - missing.length;
  return {
    filled,
    total,
    percent: Math.round((filled / total) * 100),
    missing,
    isComplete: missing.length === 0,
  };
}
