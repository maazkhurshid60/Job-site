import { handle, ok } from "@/lib/server/respond";
import { listAdminAuditLog } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: history of every grant/revoke/invite against the admin allow-list. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await listAdminAuditLog());
  });
}
