import {
  handle, ok, jsonBody, str, NotFound,
} from "@/lib/server/respond";
import {
  getSubmission, listSubmissionMessages, createSubmissionMessage,
} from "@/lib/server/repo";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    if (!(await getSubmission(id))) throw new NotFound("Submission not found.");
    return ok(await listSubmissionMessages(id));
  });
}

/* Any admin may reply — the thread is JobFolder's, not one admin's personally
   — so sender_uid records who actually typed it, but the recruiter-facing
   name is always the team, matching how every other admin action already
   reads to a recruiter (a status change, not "Alex changed your status"). */
export function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const uid = await requireAdmin(req);
    const { id } = await params;
    if (!(await getSubmission(id))) throw new NotFound("Submission not found.");

    const body = await jsonBody(req);
    const text = str(body.body, "body", { max: 4000, required: true });

    const messageId = await createSubmissionMessage({
      submissionId: id,
      senderRole: "admin",
      senderUid: uid,
      senderName: "JobFolder Team",
      body: text,
    });
    return ok({ id: messageId }, { status: 201 });
  });
}
