import { handle, ok } from "@/lib/server/respond";
import { listUsers } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: the recruiter roster. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    return ok(await listUsers());
  });
}
