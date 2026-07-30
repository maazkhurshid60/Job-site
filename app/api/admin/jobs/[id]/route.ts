import { handle, ok, jsonBody, NotFound } from "@/lib/server/respond";
import { getJob, updateJob, deleteJob } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import { readJobWrite } from "../../jobWrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: read any job, including drafts (the edit form needs this). */
export function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const job = await getJob(id);
    if (!job) throw new NotFound("Job not found.");
    return ok(job);
  });
}

export function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const updated = await updateJob(id, readJobWrite(await jsonBody(req)));
    if (!updated) throw new NotFound("Job not found.");
    return ok({ id });
  });
}

/* Deleting a job cascades to its submissions (fk_subs_job ON DELETE CASCADE).
   That is intentional — orphaned submissions pointing at a removed role are
   worse than none — but it does mean this is not a reversible action. */
export function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const deleted = await deleteJob(id);
    if (!deleted) throw new NotFound("Job not found.");
    return ok({ id });
  });
}
