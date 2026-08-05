import {
  handle, ok, jsonBody, str, BadRequest, NotFound,
} from "@/lib/server/respond";
import {
  createSubmission, getOpenJob, listSubmissionsByRecruiter, getUserProfile,
  cvFileIsAvailable,
} from "@/lib/server/repo";
import { requireUid, isAdmin, AuthError } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A recruiter's own submissions. Never anyone else's — the uid comes from the
    verified token, never from the request body or a query param. */
export function GET(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    return ok(await listSubmissionsByRecruiter(uid));
  });
}

/* Create a submission. Sign-in is REQUIRED, and the caller must NOT be an
   admin.

   This is the enforcement point. The form is also hidden from signed-out
   visitors and from admins, but that is only presentation — a request straight
   to this endpoint has to be refused here, or the rule does not exist.

   Why admins are blocked: an admin screens and decides every submission's
   status, including their own if they were allowed to create one. Letting the
   same account both refer a candidate and judge that referral is a conflict of
   interest the UI shouldn't even offer.

   Note what is NOT taken from the body: jobTitle, company and bounty are read
   from the jobs table, not trusted from the client. Otherwise anyone could post
   a submission claiming a $50,000 commission. */
export function POST(req: Request) {
  return handle(async () => {
    const uid = await requireUid(req);
    if (await isAdmin(uid)) {
      throw new AuthError("Admin accounts can't submit candidates.", 403);
    }
    const body = await jsonBody(req);

    const jobId = str(body.jobId, "jobId", { max: 64, required: true });
    const job = await getOpenJob(jobId);
    if (!job) throw new NotFound("Role not available.");

    /* The CV was uploaded to POST /api/files first and its bytes are already
       in the database. Verify the id names a real, unattached CV rather than
       trusting it: otherwise a caller could point a new submission at someone
       else's CV row, or at an avatar. */
    const cvFileId = str(body.cvFileId, "cvFileId", { max: 36, required: true });
    if (!(await cvFileIsAvailable(cvFileId))) {
      throw new BadRequest("That CV upload is missing or already used.");
    }

    const profile = await getUserProfile(uid);
    const recruiterName = profile?.name || "Recruiter";

    const id = await createSubmission({
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      recruiterId: uid,
      recruiterName,
      candidateName: str(body.candidateName, "candidateName", { max: 255, required: true }),
      candidateEmail: str(body.candidateEmail, "candidateEmail", { max: 320, required: true }),
      candidatePhone: str(body.candidatePhone, "candidatePhone", { max: 64, required: true }),
      notes: str(body.notes, "notes"),
      cvFileId,
      bounty: job.bounty,
    }).catch((err: unknown) => {
      // uq_subs_job_candidate — this candidate is already referred for this role.
      if (
        err &&
        typeof err === "object" &&
        (err as { code?: string }).code === "ER_DUP_ENTRY"
      ) {
        throw new BadRequest(
          "This candidate has already been submitted for this role.",
        );
      }
      throw err;
    });

    return ok({ id }, { status: 201 });
  });
}
