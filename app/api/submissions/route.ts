import {
  handle, ok, jsonBody, str, BadRequest, NotFound,
} from "@/lib/server/respond";
import {
  createSubmission, getOpenJob, listSubmissionsByRecruiter, getUserProfile,
} from "@/lib/server/repo";
import { getUid, requireUid } from "@/lib/server/auth";

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

/* Create a submission.

   Open applications: signing in is optional, matching the old Firestore rule.
   A signed-in caller is recorded as the referrer; an anonymous one is stored
   with recruiter_id NULL and the name "Public applicant".

   Note what is NOT taken from the body: jobTitle, company and bounty are read
   from the jobs table, not trusted from the client. Otherwise anyone could post
   a submission claiming a $50,000 commission. */
export function POST(req: Request) {
  return handle(async () => {
    const body = await jsonBody(req);
    const uid = await getUid(req);

    const jobId = str(body.jobId, "jobId", { max: 64, required: true });
    const job = await getOpenJob(jobId);
    if (!job) throw new NotFound("Role not available.");

    const cvUrl = str(body.cvUrl, "cvUrl", { max: 1024, required: true });
    // The CV is uploaded to Firebase Storage by the browser before this call;
    // reject anything that isn't one of those URLs.
    if (!/^https:\/\//i.test(cvUrl)) {
      throw new BadRequest("cvUrl must be an https URL.");
    }

    let recruiterName = "Public applicant";
    if (uid) {
      const profile = await getUserProfile(uid);
      recruiterName = profile?.name || "Recruiter";
    }

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
      cvUrl,
      cvName: str(body.cvName, "cvName", { max: 255 }),
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
