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
  /** Both optional — "" means none on file. */
  candidateLinkedin: string;
  candidatePhotoUrl: string;
  notes: string;
  /* A signed, one-hour download link minted by the server each time this
     submission is read. Not stored, and not shareable for long. */
  cvUrl: string;
  cvName: string;
  /** MIME type of the stored CV — decides whether it can be previewed. */
  cvType: string;
  /** Size of the stored CV in bytes, or null when there is no CV. */
  cvSize: number | null;
  /** Internal/client-facing figure — never shown to the recruiter. */
  bounty: number | null;
  /** Recruiter-facing fee tier, snapshotted from the job at submission time —
      see lib/feeTiers.ts. This, not bounty, is what a recruiter earns. */
  feeTier: string | null;
  status: SubmissionStatus;
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
  /* The referring recruiter's profile, for the admin console's detail view.
     Only populated by the admin endpoint — a recruiter listing their own
     submissions has no business reading other people's contact details, and
     already knows their own. Null for an open application, or when the
     recruiter's account has since been deleted. */
  recruiter?: SubmissionRecruiter | null;
};

export type SubmissionRecruiter = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  headline: string;
  location: string;
  linkedin: string;
  website: string;
  twitter: string;
  facebook: string;
  instagram: string;
  photoURL: string;
  /** When they joined — ISO-8601, or null. */
  createdAt: string | null;
};

export type SubmissionInput = {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  /** Both optional. */
  candidateLinkedin: string;
  notes: string;
};

/* A short, friendly reference for a submission's confirmation screen — the
   real primary key is a UUID, which is not something to hand a recruiter as
   "your reference number". Deterministic (same id always renders the same
   code), just not the raw key. */
export function submissionRef(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return `JF-${String(hash % 100000).padStart(5, "0")}`;
}

/* Upload the candidate's CV, then create the submission. Requires a signed-in
   recruiter — the server rejects both calls otherwise.

   `recruiter` is kept in the signature for call-site compatibility but is not
   trusted for identity: the server reads the referrer from the verified ID
   token, so passing a different uid here has no effect. Job title, company and
   bounty are likewise read server-side from the jobs table, so a client cannot
   claim a commission the role doesn't carry. */
export async function createSubmission(
  job: Job,
  _recruiter: { uid: string; name: string } | null,
  input: SubmissionInput,
  cv: File,
  photo?: File | null,
): Promise<{ id: string }> {
  // Checked again server-side; this is just a fast, friendly failure.
  if (cv.size > MAX_CV_BYTES) throw new Error("CV is larger than 4 MB.");
  if (!ACCEPTED_CV_TYPES.includes(cv.type))
    throw new Error("CV must be a PDF or Word document.");

  // Store the bytes first, then reference them from the submission.
  const { id: cvFileId } = await uploadFile(cv, "cv");
  const candidatePhotoUrl = photo ? (await uploadFile(photo, "avatar")).url ?? "" : "";

  return apiFetch<{ id: string }>("/api/submissions", {
    method: "POST",
    auth: true,
    body: {
      jobId: job.id,
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail,
      candidatePhone: input.candidatePhone,
      candidateLinkedin: input.candidateLinkedin,
      candidatePhotoUrl,
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

/* ------------------------------------------------- submission messages */

/* A conversation thread attached to one submission — the recruiter and
   JobFolder staff talking about that specific candidate. There is no general
   inbox: JobFolder has no employer accounts yet, so these two parties are the
   only ones who can ever be on a thread. */
export type SubmissionMessage = {
  id: string;
  submissionId: string;
  senderRole: "recruiter" | "admin";
  senderUid: string | null;
  senderName: string;
  body: string;
  createdAt: string | null;
};

export function listSubmissionMessages(submissionId: string): Promise<SubmissionMessage[]> {
  return apiFetch<SubmissionMessage[]>(
    `/api/submissions/${encodeURIComponent(submissionId)}/messages`,
    { auth: true },
  );
}

export function sendSubmissionMessage(submissionId: string, body: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    `/api/submissions/${encodeURIComponent(submissionId)}/messages`,
    { method: "POST", auth: true, body: { body } },
  );
}

export function listAdminSubmissionMessages(submissionId: string): Promise<SubmissionMessage[]> {
  return apiFetch<SubmissionMessage[]>(
    `/api/admin/submissions/${encodeURIComponent(submissionId)}/messages`,
    { auth: true },
  );
}

export function sendAdminSubmissionMessage(submissionId: string, body: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    `/api/admin/submissions/${encodeURIComponent(submissionId)}/messages`,
    { method: "POST", auth: true, body: { body } },
  );
}
