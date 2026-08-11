import { apiFetch } from "./api";

/* Job data. Backed by MySQL via /api/jobs and /api/admin/jobs.

   Timestamps are ISO strings now, not Firestore Timestamps. Anything that used
   to call .toMillis() should use `new Date(job.createdAt ?? 0).getTime()`, or
   just compare the strings — ISO-8601 sorts correctly lexicographically. */

export type JobStatus = "draft" | "open" | "closed";

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
] as const;

/* A plain string, not a union of the five constants above.
 *
 * Employment types are admin-editable (console → Board filters), so a recruiting
 * desk can add "Contract to hire" or "Per diem" without a code change. A closed
 * union would make every admin-defined type a type error the moment it reached
 * the API, which is exactly the mismatch this widening prevents.
 *
 * EMPLOYMENT_TYPES below stays as the seed and the fallback; the API validates
 * incoming values against the *saved* list, so the set is still closed at
 * runtime — just not at compile time. */
export type EmploymentType = string;

export const JOB_CATEGORIES = [
  "Civil Engineering",
  "Transportation / DOT",
  "Structural Engineering",
  "MEP Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Water / Hydrology",
  "CEI / Inspection",
  "Project Management",
  "Architecture (AEC)",
  "Software Engineering",
  "AWS / DevOps",
  "Data Science",
  "Information Technology",
  "Government / Cleared",
  "DOD / Intelligence",
  "Finance",
  "Automotive",
  "Electronics",
  "Executive",
  "Other",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

export type FAQ = { question: string; answer: string };

export const DEFAULT_HIRING_STAGES = [
  "Application review",
  "Screening call",
  "Client interview",
  "Offer",
];

/* A role JobFolder is sourcing for. `company` is the client. `bounty` is an
   internal/admin figure (what the client pays JobFolder, per the client
   agreement) — it is never shown to recruiters. `feeTier` (lib/feeTiers.ts)
   is the recruiter-facing amount: what a recruiter earns on a confirmed
   hire, published up front. The two are deliberately decoupled so JobFolder
   controls its own margin. */
export type Job = {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  remote: boolean;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  bounty: number | null;
  /** Recruiter fee tier — see lib/feeTiers.ts. Null on jobs posted before the tier system. */
  feeTier: string | null;
  description: string; // the "Job Brief"
  responsibilities: string;
  requirements: string;
  faqs: FAQ[];
  screeningQuestions: string[];
  hiringStages: string[];
  status: JobStatus;
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
  updatedAt: string | null;
  /** Only present on GET /api/jobs/[id] (the recruiter-facing detail read) — how
      many candidates have been submitted for this role so far. */
  submissionCount?: number;
};

/* Fields the admin form supplies (everything except server-managed ones). */
export type JobInput = Omit<Job, "id" | "createdAt" | "updatedAt">;

/** Admin: every job, any status. */
export function listJobs(): Promise<Job[]> {
  return apiFetch<Job[]>("/api/admin/jobs", { auth: true });
}

/** Public: only `open` roles, newest first. */
export function listOpenJobs(): Promise<Job[]> {
  return apiFetch<Job[]>("/api/jobs");
}

/* Public read. Returns null for a missing, draft or closed role — the detail
   page treats all three the same way, as it did under the old rules. */
export async function getJob(id: string): Promise<Job | null> {
  try {
    return await apiFetch<Job>(`/api/jobs/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

/** Admin read — includes drafts, for the edit form. */
export function getJobAsAdmin(id: string): Promise<Job> {
  return apiFetch<Job>(`/api/admin/jobs/${encodeURIComponent(id)}`, {
    auth: true,
  });
}

export async function createJob(input: JobInput): Promise<string> {
  const { id } = await apiFetch<{ id: string }>("/api/admin/jobs", {
    method: "POST",
    body: input,
    auth: true,
  });
  return id;
}

export async function updateJob(id: string, input: JobInput): Promise<void> {
  await apiFetch(`/api/admin/jobs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
    auth: true,
  });
}

export async function deleteJob(id: string): Promise<void> {
  await apiFetch(`/api/admin/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}
