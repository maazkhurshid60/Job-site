import {
  handle, ok, jsonBody, str, NotFound,
} from "@/lib/server/respond";
import {
  getSubmission, listSubmissionMessages, createSubmissionMessage, getUserProfile,
} from "@/lib/server/repo";
import { requireUid, requireActiveUid } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* A recruiter's own conversation about one of their submissions. Ownership is
   checked against submission.recruiterId, not trusted from the URL — the id
   in the path only says which thread, never who is allowed to read it. */
async function ownSubmissionOrNotFound(id: string, uid: string) {
  const submission = await getSubmission(id);
  if (!submission || submission.recruiterId !== uid) {
    // Same response whether the id is wrong or just not theirs — a 403 would
    // confirm the id exists, which is exactly what another recruiter's
    // submission id should not do.
    throw new NotFound("Submission not found.");
  }
  return submission;
}

export function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const uid = await requireUid(req);
    const { id } = await params;
    await ownSubmissionOrNotFound(id, uid);
    return ok(await listSubmissionMessages(id));
  });
}

export function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const uid = await requireActiveUid(req);
    const { id } = await params;
    await ownSubmissionOrNotFound(id, uid);

    const body = await jsonBody(req);
    const text = str(body.body, "body", { max: 4000, required: true });

    const profile = await getUserProfile(uid);
    const senderName = profile?.name || "Recruiter";

    const messageId = await createSubmissionMessage({
      submissionId: id,
      senderRole: "recruiter",
      senderUid: uid,
      senderName,
      body: text,
    });
    return ok({ id: messageId }, { status: 201 });
  });
}
