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
   — and the recruiter-facing name is always the team, matching how every
   other admin action reads to a recruiter (a status change, not "Alex
   changed your status").

   sender_uid is NULL, which is what the column was designed for: it carries
   a foreign key to users(uid), and an admin is not a user. Passing the
   admin's uid here made every single admin reply fail — the only admin
   account's uid is not in `users`, so fk_sub_msgs_sender rejected the
   insert, the POST 500'd, and the UI showed "Could not send message". The
   submission_messages table held zero rows: no admin reply had ever been
   delivered since the feature shipped. It looked intermittent because the
   only time anyone tried was while reading a CV.

   Who typed it is not lost — admin actions are recorded in
   admin_audit_log. If per-admin attribution is ever wanted in the thread
   itself, it needs its own column without this foreign key, not this one. */
export function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    await requireAdmin(req);
    const { id } = await params;
    if (!(await getSubmission(id))) throw new NotFound("Submission not found.");

    const body = await jsonBody(req);
    const text = str(body.body, "body", { max: 4000, required: true });

    const messageId = await createSubmissionMessage({
      submissionId: id,
      senderRole: "admin",
      senderUid: null,
      senderName: "JobFolder Team",
      body: text,
    });
    return ok({ id: messageId }, { status: 201 });
  });
}
