import { apiFetch, uploadFile } from "./api";
import { ACCEPTED_CV_TYPES, MAX_CV_BYTES } from "./cv";

/* A recruiter's own saved candidate pool — separate from `submissions`,
   which is a referral already sent to a specific job. Saved here once, a
   candidate can be quick-applied to any open role without retyping their
   details or re-uploading a CV every time (see quickApply below). */

export type SavedCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  cvFileId: string | null;
  /** Signed, one-hour download link — same as a submission's cvUrl. */
  cvUrl: string;
  cvName: string;
  cvType: string;
  cvSize: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SavedCandidateInput = {
  name: string;
  phone: string;
  notes: string;
};

function checkCv(cv: File) {
  if (cv.size > MAX_CV_BYTES) throw new Error("CV is larger than 10 MB.");
  if (!ACCEPTED_CV_TYPES.includes(cv.type))
    throw new Error("CV must be a PDF or Word document.");
}

/** This recruiter's saved candidates, newest first. */
export function listCandidates(): Promise<SavedCandidate[]> {
  return apiFetch<SavedCandidate[]>("/api/candidates", { auth: true });
}

/** Save a new candidate to the pool. CV is optional here — required only at
    the point of actually quick-applying (see quickApply). */
export async function createCandidate(
  input: SavedCandidateInput & { email: string },
  cv: File | null,
): Promise<SavedCandidate> {
  let cvFileId: string | undefined;
  if (cv) {
    checkCv(cv);
    cvFileId = (await uploadFile(cv, "cv")).id;
  }
  return apiFetch<SavedCandidate>("/api/candidates", {
    method: "POST",
    auth: true,
    body: { ...input, cvFileId },
  });
}

/** Update a saved candidate. Passing a new CV replaces the old one; omitting
    it leaves whatever was already saved untouched. */
export async function updateCandidate(
  id: string,
  input: SavedCandidateInput,
  cv: File | null,
): Promise<SavedCandidate> {
  let cvFileId: string | undefined;
  if (cv) {
    checkCv(cv);
    cvFileId = (await uploadFile(cv, "cv")).id;
  }
  return apiFetch<SavedCandidate>(`/api/candidates/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    body: { ...input, ...(cvFileId ? { cvFileId } : {}) },
  });
}

export async function deleteCandidate(id: string): Promise<void> {
  await apiFetch(`/api/candidates/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Quick-apply a saved candidate to an open job — no form, no re-upload. The
    server pulls name/email/phone from the pool entry and clones its CV into
    a fresh file so the same saved candidate can be applied to any number of
    roles independently. Fails if the candidate has no CV saved yet. */
export function quickApply(
  jobId: string,
  candidateId: string,
  notes: string,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/api/submissions", {
    method: "POST",
    auth: true,
    body: { jobId, candidateId, notes },
  });
}
