import { handle, ok } from "@/lib/server/respond";
import { listAllSubmissions } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: every submission, newest first. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await listAllSubmissions());
  });
}
