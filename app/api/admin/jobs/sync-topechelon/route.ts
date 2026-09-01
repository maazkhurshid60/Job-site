import { handle, ok } from "@/lib/server/respond";
import { requireAdminIdentity } from "@/lib/server/auth";
import { logAdminAction } from "@/lib/server/repo";
import { runTopEchelonSync } from "@/lib/server/topechelon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Fetches the portal listing plus one detail page per new job (5 at a time).
// Comfortably under a minute for Metro's current ~40-job portal; raise this
// if the portal grows a lot and the route starts timing out.
export const maxDuration = 60;

/** Admin: pull Metro's live Top Echelon postings into `jobs` as drafts.
    Same logic as `npm run scrape:topechelon`, triggered from the console
    instead of the CLI. Always imports as drafts — publishing stays a
    separate, deliberate admin action. */
export function POST(req: Request) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);

    const result = await runTopEchelonSync({ publish: false });

    await logAdminAction({
      action: "jobs_synced",
      actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
      targetUid: null, targetName: "Top Echelon", targetEmail: "",
      details: `${result.added} added, ${result.skipped} already imported, ${result.failed} failed (of ${result.found} found).`,
    });

    return ok(result);
  });
}
