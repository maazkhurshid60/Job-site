import { handle, ok, jsonBody, BadRequest, str } from "@/lib/server/respond";
import { getSetting, setSetting } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import { JOB_CATEGORIES } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "jobCategories";
const FALLBACK = [...JOB_CATEGORIES] as string[];

/** Public read — the board and the posting form both need this list. */
export function GET() {
  return handle(async () => {
    const list = await getSetting<string[]>(KEY, FALLBACK);
    return ok(list.length ? list : FALLBACK);
  });
}

/** Admin write. Trims, drops blanks, de-dupes case-insensitively, keeps order
    — same normalisation the old client-side saveCategories() did. */
export function PUT(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const body = await jsonBody(req);

    if (!Array.isArray(body.list)) {
      throw new BadRequest("list must be an array of strings.");
    }

    const seen = new Set<string>();
    const clean: string[] = [];
    for (const raw of body.list) {
      const value = str(raw, "category", { max: 128 });
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      clean.push(value);
    }

    if (!clean.length) throw new BadRequest("At least one category is required.");

    await setSetting(KEY, clean);
    return ok(clean);
  });
}
