/* Shared between the site builder wizard, the live preview, and the public
   /sites/[slug] page — so "what a theme looks like" is defined in exactly one
   place. No "server-only": this needs to import cleanly into client
   components too. */

export type SiteTemplate = "classic" | "bold";

export const SITE_TEMPLATES: { id: SiteTemplate; label: string; description: string }[] = [
  {
    id: "classic",
    label: "Classic",
    description: "A centered, single-column page — photo, story, then track record.",
  },
  {
    id: "bold",
    label: "Bold",
    description: "A full-width colour banner up top, details below in two columns.",
  },
];

export type SiteThemeId = "navy" | "coral" | "sage" | "amber" | "graphite" | "plum";

export type SiteTheme = {
  id: SiteThemeId;
  label: string;
  /** Hex values, applied as CSS custom properties — see RecruiterSiteView. */
  accent: string;
  accentDark: string;
  accentSoft: string;
};

export const SITE_THEMES: SiteTheme[] = [
  { id: "navy", label: "Navy", accent: "#224fa8", accentDark: "#123173", accentSoft: "#e2e9f5" },
  { id: "coral", label: "Coral", accent: "#ee5b3f", accentDark: "#c4432a", accentSoft: "#fbe3dd" },
  { id: "sage", label: "Sage", accent: "#5b8c4a", accentDark: "#3f6533", accentSoft: "#dbe8d3" },
  { id: "amber", label: "Amber", accent: "#c98a1f", accentDark: "#9c6b17", accentSoft: "#f7e6c4" },
  { id: "graphite", label: "Graphite", accent: "#17130f", accentDark: "#000000", accentSoft: "#e8e6e2" },
  { id: "plum", label: "Plum", accent: "#7c3f6b", accentDark: "#5c2e4f", accentSoft: "#ecdcea" },
];

export function siteTheme(id: string): SiteTheme {
  return SITE_THEMES.find((t) => t.id === id) ?? SITE_THEMES[0];
}

export function siteTemplate(id: string): SiteTemplate {
  return SITE_TEMPLATES.some((t) => t.id === id) ? (id as SiteTemplate) : "classic";
}

/** Lowercase letters, numbers and hyphens; can't start/end with a hyphen. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugProblem(slug: string): string | null {
  if (!slug) return "Choose a link for your site.";
  if (slug.length < 3) return "Must be at least 3 characters.";
  if (slug.length > 48) return "Must be 48 characters or fewer.";
  if (!SLUG_PATTERN.test(slug)) {
    return "Only lowercase letters, numbers, and hyphens — no spaces or symbols.";
  }
  return null;
}

/** Reserved so a slug can never collide with a real app route. */
export const RESERVED_SLUGS = new Set([
  "dashboard", "login", "signup", "jobs", "contact", "terms", "privacy",
  "cookie-policy", "api", "admin", "console-4h9k2xqf", "sites",
]);
