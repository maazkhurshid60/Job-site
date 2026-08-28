import { handle, ok, jsonBody, str, bool, oneOf, BadRequest } from "@/lib/server/respond";
import {
  getRecruiterSiteByUid, getUserProfile, upsertRecruiterSite, SlugTakenError,
} from "@/lib/server/repo";
import { requireActiveUid } from "@/lib/server/auth";
import { SITE_TEMPLATES, SITE_THEMES, RESERVED_SLUGS, slugProblem } from "@/lib/siteThemes";
import type { SiteStat, SiteExpertise, SiteExperience } from "@/lib/recruiterSite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMPLATE_IDS = SITE_TEMPLATES.map((t) => t.id);
const THEME_IDS = SITE_THEMES.map((t) => t.id);

/** A recruiter-authored list field (specialisms, highlights): trim each
    entry, drop empties, and cap both the count and each entry's length. */
function strArray(value: unknown, field: string, { max = 20, itemMax = 200 } = {}): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequest(`${field} must be an array.`);
  const out: string[] = [];
  for (const v of value) {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) continue;
    if (s.length > itemMax) throw new BadRequest(`Each ${field} entry must be ${itemMax} characters or fewer.`);
    out.push(s);
  }
  if (out.length > max) throw new BadRequest(`${field} can have at most ${max} entries.`);
  return out;
}

function statsArray(value: unknown): SiteStat[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequest("stats must be an array.");
  if (value.length > 4) throw new BadRequest("stats can have at most 4 entries.");
  return value.map((item, i) => {
    if (!item || typeof item !== "object") throw new BadRequest(`stats[${i}] must be an object.`);
    const v = item as Record<string, unknown>;
    return {
      value: str(v.value, `stats[${i}].value`, { max: 16, required: true }),
      label: str(v.label, `stats[${i}].label`, { max: 64, required: true }),
    };
  });
}

function expertiseArray(value: unknown): SiteExpertise[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequest("expertise must be an array.");
  if (value.length > 8) throw new BadRequest("expertise can have at most 8 entries.");
  return value.map((item, i) => {
    if (!item || typeof item !== "object") throw new BadRequest(`expertise[${i}] must be an object.`);
    const v = item as Record<string, unknown>;
    const percent = Number(v.percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new BadRequest(`expertise[${i}].percent must be a number between 0 and 100.`);
    }
    return {
      skill: str(v.skill, `expertise[${i}].skill`, { max: 64, required: true }),
      percent: Math.round(percent),
    };
  });
}

function experienceArray(value: unknown): SiteExperience[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new BadRequest("experience must be an array.");
  if (value.length > 6) throw new BadRequest("experience can have at most 6 entries.");
  return value.map((item, i) => {
    if (!item || typeof item !== "object") throw new BadRequest(`experience[${i}] must be an object.`);
    const v = item as Record<string, unknown>;
    return {
      role: str(v.role, `experience[${i}].role`, { max: 120, required: true }),
      company: str(v.company, `experience[${i}].company`, { max: 120, required: true }),
      period: str(v.period, `experience[${i}].period`, { max: 64 }),
      current: bool(v.current),
      bullets: strArray(v.bullets, `experience[${i}].bullets`, { max: 8, itemMax: 300 }),
    };
  });
}

/** The caller's own site, or null if they haven't started one. Returned
    regardless of whether the builder is currently enabled for them — a
    revoked perk shouldn't hide what they already built. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireActiveUid(req);
    return ok(await getRecruiterSiteByUid(uid));
  });
}

/** Create or update the caller's own site. Requires the admin-set
    siteBuilderEnabled flag — enforced here, not just hidden in the UI. */
export function PUT(req: Request) {
  return handle(async () => {
    const uid = await requireActiveUid(req);
    const profile = await getUserProfile(uid);
    if (!profile?.siteBuilderEnabled) {
      throw new BadRequest(
        "The recruiter website builder isn't unlocked for your account yet.",
      );
    }

    const body = await jsonBody(req);

    const slug = str(body.slug, "slug", { max: 48, required: true }).toLowerCase();
    const slugIssue = slugProblem(slug);
    if (slugIssue) throw new BadRequest(slugIssue);
    if (RESERVED_SLUGS.has(slug)) {
      throw new BadRequest("That link isn't available — please choose another.");
    }

    const site = await upsertRecruiterSite(uid, {
      slug,
      template: oneOf(body.template, TEMPLATE_IDS, "template", "classic"),
      theme: oneOf(body.theme, THEME_IDS, "theme", "navy"),
      tagline: str(body.tagline, "tagline", { max: 255 }),
      intro: str(body.intro, "intro", { max: 8000 }),
      specialisms: JSON.stringify(strArray(body.specialisms, "specialisms", { max: 12, itemMax: 60 })),
      highlights: JSON.stringify(strArray(body.highlights, "highlights", { max: 12, itemMax: 200 })),
      stats: JSON.stringify(statsArray(body.stats)),
      expertise: JSON.stringify(expertiseArray(body.expertise)),
      experience: JSON.stringify(experienceArray(body.experience)),
      ctaLabel: str(body.ctaLabel, "ctaLabel", { max: 64 }),
      ctaUrl: str(body.ctaUrl, "ctaUrl", { max: 512 }),
      published: bool(body.published),
    }).catch((err: unknown) => {
      if (err instanceof SlugTakenError) throw new BadRequest(err.message);
      throw err;
    });

    return ok(site);
  });
}
