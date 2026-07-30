import { handle, ok, jsonBody, oneOf, NotFound } from "@/lib/server/respond";
import { setSubmissionStatus } from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";
import { SUBMISSION_STATUSES } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: move a submission through the screening pipeline. */
export function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    const body = await jsonBody(req);
    const status = oneOf(body.status, SUBMISSION_STATUSES, "status");

    const updated = await setSubmissionStatus(id, status);
    if (!updated) throw new NotFound("Submission not found.");
    return ok({ id, status });
  });
}
