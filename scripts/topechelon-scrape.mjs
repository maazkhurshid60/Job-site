/* Pure scraping/parsing for Metro Associates' Top Echelon careers portal — no
 * database access, so it can be imported both by the CLI script (plain node,
 * scripts/scrape-topechelon-jobs.mjs) and by the Next.js server
 * (lib/server/topechelon.ts, which owns the DB side and is what the admin
 * console's "Sync Top Echelon" button calls). Keeping the scraping/parsing
 * logic in one file means a fix to category rules or JSON-LD parsing doesn't
 * have to be made twice.
 */

export const PORTAL_URL = "https://careers.topechelon.com/portals/3a7f6fd3-7cf7-447c-a20f-2354eb2031df";

// Checked in order — first match wins. Built from the actual job titles on
// Metro's portal; extend this if a future title doesn't match anything and
// falls through to "Other".
export const CATEGORY_RULES = [
  // A resident engineer runs construction oversight on site — inspection
  // work under a different title, and the portal uses both.
  [/inspect|resident engineer/i, "CEI / Inspection"],
  [/bridge|structural/i, "Structural Engineering"],
  [/transportation|roadway|highway|traffic|dot\b|ctdot|indot|ridot|txdot|adot/i, "Transportation / DOT"],
  [/mechanical.*plumbing|\bmep\b/i, "MEP Engineering"],
  [/electrical/i, "Electrical Engineering"],
  [/mechanical|refrigeration|hvac/i, "Mechanical Engineering"],
  [/water|hydrology|wastewater/i, "Water / Hydrology"],
  [/civil|land development|land surveyor|site (civil|engineer)/i, "Civil Engineering"],
  // "Project engineer" and estimating both sit under delivery management in
  // this taxonomy; neither has a category of its own.
  [/project manager|program manager|project engineer|estimat/i, "Project Management"],
  [/architect/i, "Architecture (AEC)"],
];

export function guessCategory(title) {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(title)) return category;
  }
  return "Other";
}

export const EMPLOYMENT_TYPE_MAP = {
  "Direct Hire": "Full-time",
  "Full-time": "Full-time",
  "Part-time": "Part-time",
  Contract: "Contract",
  Temporary: "Temporary",
  Internship: "Internship",
};

/** The JobPosting `description` is a small, well-formed HTML fragment (p/ul/
 *  li/h3/strong) — not arbitrary markup — so a handful of targeted
 *  replacements is enough; no HTML-parser dependency needed for this. */
export function htmlToText(html) {
  return html
    .replace(/<h3[^>]*>/gi, "\n\n### ")
    .replace(/<\/h3>/gi, " ###\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchJobIds() {
  const res = await fetch(PORTAL_URL);
  if (!res.ok) throw new Error(`Portal fetch failed: ${res.status}`);
  const html = await res.text();
  const ids = [...html.matchAll(/\/jobs\/([a-f0-9-]{36})/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

export async function fetchJobPosting(teId) {
  const url = `${PORTAL_URL}/jobs/${teId}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const html = await res.text();
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) return null;

  let posting;
  try {
    posting = JSON.parse(match[1]);
  } catch {
    return null;
  }

  const addr = posting.jobLocation?.address ?? {};
  const location = [addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ");

  return {
    teId,
    title: posting.title ?? "Untitled role",
    company: posting.hiringOrganization?.name || "Metro Associates",
    category: guessCategory(posting.title ?? ""),
    location,
    description: htmlToText(posting.description ?? ""),
  };
}

/** Fetch job detail pages a few at a time — sequential would run 40+ external
 *  fetches back to back, which is slow and, for the admin route, risks the
 *  serverless request-duration limit. */
export async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
