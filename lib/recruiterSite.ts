import { apiFetch } from "./api";
import type { SiteTemplate, SiteThemeId } from "./siteThemes";

/** One entry in the hero stat row, e.g. { value: "8+", label: "Years recruiting" }. */
export type SiteStat = { value: string; label: string };

/** One animated skill bar, e.g. { skill: "DOT Recruiting", percent: 90 }. */
export type SiteExpertise = { skill: string; percent: number };

/** One role in the work-history timeline, most recent first. */
export type SiteExperience = {
  role: string;
  company: string;
  period: string;
  current: boolean;
  bullets: string[];
};

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
  stats: SiteStat[];
  expertise: SiteExpertise[];
  experience: SiteExperience[];
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
  stats: SiteStat[];
  expertise: SiteExpertise[];
  experience: SiteExperience[];
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

/** Live availability check for the slug field — checked as the recruiter
    types, not just on save. */
export function checkSlugAvailable(
  slug: string,
): Promise<{ available: boolean; reason?: string }> {
  return apiFetch<{ available: boolean; reason?: string }>(
    `/api/me/site/slug-check?slug=${encodeURIComponent(slug)}`,
    { auth: true },
  );
}

/** Admin action: read-only look at any recruiter's site, or null if they
    haven't started one. */
export function getRecruiterSiteForAdmin(uid: string): Promise<RecruiterSite | null> {
  return apiFetch<RecruiterSite | null>(
    `/api/admin/recruiters/${encodeURIComponent(uid)}/site`,
    { auth: true },
  );
}
