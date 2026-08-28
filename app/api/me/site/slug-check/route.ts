import { handle, ok } from "@/lib/server/respond";
import { slugTakenByOther } from "@/lib/server/repo";
import { requireActiveUid } from "@/lib/server/auth";
import { RESERVED_SLUGS, slugProblem } from "@/lib/siteThemes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Live availability check for the slug field in step 1 of the wizard — so a
    collision (two recruiters with the same name is not unusual) shows up
    while typing instead of only as an error on save. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireActiveUid(req);
    const slug = new URL(req.url).searchParams.get("slug")?.trim().toLowerCase() ?? "";

    const problem = slugProblem(slug);
    if (problem) return ok({ available: false, reason: problem });
    if (RESERVED_SLUGS.has(slug)) {
      return ok({ available: false, reason: "That link isn't available — please choose another." });
    }
    if (await slugTakenByOther(slug, uid)) {
      return ok({ available: false, reason: "That link is already taken — please choose another." });
    }
    return ok({ available: true });
  });
}
