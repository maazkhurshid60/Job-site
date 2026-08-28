import { handle, ok } from "@/lib/server/respond";
import { getRecruiterSiteByUid } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: read-only look at a recruiter's site (or null if they haven't
    started one) — so the console can show whether the free-site perk is
    actually being used, not just whether it's unlocked. */
export function GET(
  req: Request,
  { params }: { params: Promise<{ uid: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { uid } = await params;
    return ok(await getRecruiterSiteByUid(uid));
  });
}
