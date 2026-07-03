import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Job } from "./jobs";
import { ACCEPTED_CV_TYPES, MAX_CV_BYTES } from "./cv";

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
  recruiterId: string;
  recruiterName: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  notes: string;
  cvUrl: string;
  cvName: string;
  bounty: number | null;
  status: SubmissionStatus;
  createdAt: Timestamp | null;
};

export type SubmissionInput = {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  notes: string;
};

const subsCol = collection(db, "submissions");

function toSubmission(id: string, d: Record<string, unknown>): Submission {
  return {
    id,
    jobId: (d.jobId as string) ?? "",
    jobTitle: (d.jobTitle as string) ?? "",
    company: (d.company as string) ?? "",
    recruiterId: (d.recruiterId as string) ?? "",
    recruiterName: (d.recruiterName as string) ?? "",
    candidateName: (d.candidateName as string) ?? "",
    candidateEmail: (d.candidateEmail as string) ?? "",
    candidatePhone: (d.candidatePhone as string) ?? "",
    notes: (d.notes as string) ?? "",
    cvUrl: (d.cvUrl as string) ?? "",
    cvName: (d.cvName as string) ?? "CV",
    bounty: (d.bounty as number | null) ?? null,
    status: (d.status as SubmissionStatus) ?? "submitted",
    createdAt: (d.createdAt as Timestamp) ?? null,
  };
}

/* Recruiter action: upload the candidate's CV, then create the submission. */
export async function createSubmission(
  job: Job,
  recruiter: { uid: string; name: string },
  input: SubmissionInput,
  cv: File,
): Promise<void> {
  if (cv.size > MAX_CV_BYTES) throw new Error("CV is larger than 10 MB.");
  if (!ACCEPTED_CV_TYPES.includes(cv.type))
    throw new Error("CV must be a PDF or Word document.");

  const safeName = cv.name.replace(/[^\w.\-]+/g, "_");
  const path = `cvs/${job.id}/${Date.now()}-${safeName}`;
  const snap = await uploadBytes(ref(storage, path), cv, {
    contentType: cv.type,
  });
  const cvUrl = await getDownloadURL(snap.ref);

  await addDoc(subsCol, {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    recruiterId: recruiter.uid,
    recruiterName: recruiter.name,
    candidateName: input.candidateName,
    candidateEmail: input.candidateEmail,
    candidatePhone: input.candidatePhone,
    notes: input.notes,
    cvUrl,
    cvName: cv.name,
    bounty: job.bounty,
    status: "submitted" satisfies SubmissionStatus,
    createdAt: serverTimestamp(),
  });
}

export async function listSubmissionsByRecruiter(
  recruiterId: string,
): Promise<Submission[]> {
  const snap = await getDocs(
    query(subsCol, where("recruiterId", "==", recruiterId)),
  );
  return sortByNewest(snap.docs.map((d) => toSubmission(d.id, d.data())));
}

export async function listAllSubmissions(): Promise<Submission[]> {
  const snap = await getDocs(query(subsCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => toSubmission(d.id, d.data()));
}

export async function setSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<void> {
  await updateDoc(doc(db, "submissions", id), { status });
}

function sortByNewest(list: Submission[]): Submission[] {
  return list.sort(
    (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
  );
}
