import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type JobStatus = "draft" | "open" | "closed";

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/* Verticals Metro Opportunities / Patrick recruit across (engineering,
   technical, cleared & government). Used for the job-board category filter. */
export const JOB_CATEGORIES = [
  "Civil Engineering",
  "Transportation / DOT",
  "Structural Engineering",
  "MEP Engineering",
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

/* A role Metro Opportunities is sourcing for. `company` is the client;
   `bounty` is what a recruiter earns on a confirmed hire. */
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
  description: string;
  status: JobStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

/* Fields the admin form supplies (everything except server-managed ones). */
export type JobInput = Omit<Job, "id" | "createdAt" | "updatedAt">;

const jobsCol = collection(db, "jobs");

function toJob(id: string, data: Record<string, unknown>): Job {
  return {
    id,
    title: (data.title as string) ?? "",
    company: (data.company as string) ?? "",
    category: (data.category as string) ?? "Other",
    location: (data.location as string) ?? "",
    remote: Boolean(data.remote),
    employmentType: (data.employmentType as EmploymentType) ?? "Full-time",
    salaryMin: (data.salaryMin as number | null) ?? null,
    salaryMax: (data.salaryMax as number | null) ?? null,
    bounty: (data.bounty as number | null) ?? null,
    description: (data.description as string) ?? "",
    status: (data.status as JobStatus) ?? "draft",
    createdAt: (data.createdAt as Timestamp) ?? null,
    updatedAt: (data.updatedAt as Timestamp) ?? null,
  };
}

export async function listJobs(): Promise<Job[]> {
  const snap = await getDocs(query(jobsCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => toJob(d.id, d.data()));
}

/* Public listing: only `open` roles. No orderBy in the query (that would need
   a composite index alongside the where); we sort newest-first in memory. */
export async function listOpenJobs(): Promise<Job[]> {
  const snap = await getDocs(query(jobsCol, where("status", "==", "open")));
  return snap.docs
    .map((d) => toJob(d.id, d.data()))
    .sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
    );
}

export async function getJob(id: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, "jobs", id));
  return snap.exists() ? toJob(snap.id, snap.data()) : null;
}

export async function createJob(input: JobInput): Promise<string> {
  const ref = await addDoc(jobsCol, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateJob(id: string, input: JobInput): Promise<void> {
  await updateDoc(doc(db, "jobs", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteJob(id: string): Promise<void> {
  await deleteDoc(doc(db, "jobs", id));
}
