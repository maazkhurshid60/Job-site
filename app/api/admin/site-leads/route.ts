import { handle, ok } from "@/lib/server/respond";
import { listSiteLeads } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: every enquiry captured by a recruiter microsite, newest first,
    with whose site caught it. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await listSiteLeads());
  });
}
