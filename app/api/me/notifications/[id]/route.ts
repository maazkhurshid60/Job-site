import { handle, ok, BadRequest } from "@/lib/server/respond";
import { markNotificationRead } from "@/lib/server/repo";
import { requireUid } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mark one notification read. Ownership is enforced in the UPDATE's WHERE
    clause, so touching someone else's matches no row. Returns ok either way:
    a no-op here means "already read", which is not an error worth showing. */
export function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const uid = await requireUid(req);
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequest("That isn't a valid notification id.");
    }
    return ok({ changed: await markNotificationRead(numericId, uid) });
  });
}
