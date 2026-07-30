import { handle, ok, NotFound } from "@/lib/server/respond";
import { getOpenJob } from "@/lib/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: a single role. Drafts and closed roles 404 rather than leak. */
export function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const job = await getOpenJob(id);
    if (!job) throw new NotFound("Role not available.");
    return ok(job);
  });
}
