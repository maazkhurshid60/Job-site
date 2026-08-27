import { apiFetch } from "./api";
import type { SiteTemplate, SiteThemeId } from "./siteThemes";

/* The free recruiter website (see /dashboard/career-site). One per recruiter,
   gated by UserProfile.siteBuilderEnabled. Name, photo, contact info and
   social links are read from the recruiter's own profile — this only covers
   the site-specific extras. */
export type RecruiterSite = {
  recruiterId: string;
  slug: string;
  template: SiteTemplate;
  theme: SiteThemeId;
  tagline: string;
  intro: string;
  specialisms: string[];
  highlights: string[];
  ctaLabel: string;
  ctaUrl: string;
  published: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type RecruiterSiteInput = {
  slug: string;
  template: SiteTemplate;
  theme: SiteThemeId;
  tagline: string;
  intro: string;
  specialisms: string[];
  highlights: string[];
  ctaLabel: string;
  ctaUrl: string;
  published: boolean;
};

/** The caller's own site, or null if they haven't started one yet. */
export function getMySite(): Promise<RecruiterSite | null> {
  return apiFetch<RecruiterSite | null>("/api/me/site", { auth: true });
}

/** Create or update the caller's own site. Requires siteBuilderEnabled. */
export function saveMySite(input: RecruiterSiteInput): Promise<RecruiterSite> {
  return apiFetch<RecruiterSite>("/api/me/site", { method: "PUT", body: input, auth: true });
}
