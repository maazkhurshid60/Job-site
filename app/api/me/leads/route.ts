import { handle, ok } from "@/lib/server/respond";
import { listSiteLeadsForRecruiter } from "@/lib/server/repo";
import { requireUid } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A recruiter's own microsite enquiries. Scoped by the signed-in uid in the
    query itself, so there is no request parameter that could be tampered
    with to read someone else's leads. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    return ok(await listSiteLeadsForRecruiter(uid));
  });
}
