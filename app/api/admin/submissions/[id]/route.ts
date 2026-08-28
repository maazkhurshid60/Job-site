import { handle, ok, jsonBody, oneOf, NotFound } from "@/lib/server/respond";
import { setSubmissionStatus, getSubmission, logAdminAction } from "@/lib/server/repo";
import { requireAdminIdentity } from "@/lib/server/auth";
import { SUBMISSION_STATUSES, SUBMISSION_STATUS_LABEL } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: move a submission through the screening pipeline. */
export function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const actor = await requireAdminIdentity(req);
    const { id } = await params;
    const body = await jsonBody(req);
    const status = oneOf(body.status, SUBMISSION_STATUSES, "status");

    const before = await getSubmission(id);
    if (!before) throw new NotFound("Submission not found.");

    const updated = await setSubmissionStatus(id, status);
    if (!updated) throw new NotFound("Submission not found.");

    await logAdminAction({
      action: "submission_status_changed",
      actorUid: actor.uid, actorName: actor.name, actorEmail: actor.email,
      targetUid: id, targetName: before.candidateName, targetEmail: before.jobTitle,
      details: `${SUBMISSION_STATUS_LABEL[before.status]} → ${SUBMISSION_STATUS_LABEL[status]}`,
    });

    return ok({ id, status });
  });
}
