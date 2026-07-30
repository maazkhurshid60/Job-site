import { apiFetch, uploadFile } from "./api";
import type { Job } from "./jobs";
import { ACCEPTED_CV_TYPES, MAX_CV_BYTES } from "./cv";

/* Candidate submissions. Both the row and the CV bytes live in MySQL — the CV
   goes into the `files` table via POST /api/files, and the submission stores
   its id. Nothing touches cloud storage. */

/* Lifecycle of a recruiter's candidate submission. `approved`/`client_review`
   are the point at which the client (company) may see it. */
export type SubmissionStatus =
  | "submitted"
  | "screening"
  | "approved"
  | "client_review"
  | "hired"
  | "rejected";

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "submitted",
  "screening",
  "approved",
  "client_review",
  "hired",
  "rejected",
];

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  screening: "In screening",
  approved: "Approved",
  client_review: "With client",
  hired: "Hired",
  rejected: "Not progressed",
};

export type Submission = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  /** "" for an open/public application with no signed-in referrer. */
  recruiterId: string;
  recruiterName: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  notes: string;
  /* A signed, one-hour download link minted by the server each time this
     submission is read. Not stored, and not shareable for long. */
  cvUrl: string;
  cvName: string;
  bounty: number | null;
  status: SubmissionStatus;
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
};

export type SubmissionInput = {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  notes: string;
};

/* Upload the candidate's CV, then create the submission.

   `recruiter` is kept in the signature for call-site compatibility but is no
   longer trusted for identity: the server reads the referrer from the verified
   ID token. Passing a different uid here would have no effect. Job title,
   company and bounty are likewise read server-side from the jobs table, so a
   client cannot claim a commission the role doesn't carry. */
export async function createSubmission(
  job: Job,
  _recruiter: { uid: string; name: string } | null,
  input: SubmissionInput,
  cv: File,
): Promise<void> {
  // Checked again server-side; this is just a fast, friendly failure.
  if (cv.size > MAX_CV_BYTES) throw new Error("CV is larger than 10 MB.");
  if (!ACCEPTED_CV_TYPES.includes(cv.type))
    throw new Error("CV must be a PDF or Word document.");

  // Store the bytes first, then reference them from the submission.
  const { id: cvFileId } = await uploadFile(cv, "cv");

  await apiFetch("/api/submissions", {
    method: "POST",
    // Open applications: signing in is optional, but credits you if present.
    auth: "optional",
    body: {
      jobId: job.id,
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail,
      candidatePhone: input.candidatePhone,
      notes: input.notes,
      cvFileId,
    },
  });
}

/* The signed-in recruiter's own submissions. Takes no uid: the server derives
   the recruiter from the verified token, so there is no way to ask for someone
   else's — which is the point. */
export function listSubmissionsByRecruiter(): Promise<Submission[]> {
  return apiFetch<Submission[]>("/api/submissions", { auth: true });
}

export function listAllSubmissions(): Promise<Submission[]> {
  return apiFetch<Submission[]>("/api/admin/submissions", { auth: true });
}

export async function setSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<void> {
  await apiFetch(`/api/admin/submissions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status },
    auth: true,
  });
}
