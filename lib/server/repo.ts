import "server-only";
import { randomUUID } from "node:crypto";
import { query, queryOne, execute } from "@/lib/db";
import { signedFileUrl } from "./files";
import type { Job, JobStatus, EmploymentType, FAQ } from "@/lib/jobs";
import type { Submission, SubmissionStatus } from "@/lib/submissions";
import type { UserProfile } from "@/lib/users";

/* Data access for every table. Routes call these; nothing else touches SQL.

   Shape contract: these return exactly the types the existing client code
   already consumes, with one deliberate difference — `createdAt`/`updatedAt`
   are ISO strings here, not Firestore Timestamps. The client-side types are
   updated to match, so nothing calls .toMillis() on a string. */

/* Firestore generated 20-char IDs. New rows get a UUID; IDs migrated from
   Firestore keep their original value so /jobs/{id} URLs survive. */
const newId = () => randomUUID();

/* ------------------------------------------------------------------ jobs */

type JobRow = {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  remote: number;
  employment_type: EmploymentType;
  salary_min: number | null;
  salary_max: number | null;
  bounty: number | null;
  description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  faqs: unknown;
  screening_questions: unknown;
  hiring_stages: unknown;
  status: JobStatus;
  created_at: string | null;
  updated_at: string | null;
};

/* mysql2 returns JSON columns already parsed, but a column written as a string
   by another client comes back as a string. Tolerate both. */
function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function toJob(r: JobRow): Job {
  return {
    id: r.id,
    title: r.title,
    company: r.company,
    category: r.category,
    location: r.location,
    remote: Boolean(r.remote),
    employmentType: r.employment_type,
    salaryMin: r.salary_min,
    salaryMax: r.salary_max,
    bounty: r.bounty,
    description: r.description ?? "",
    responsibilities: r.responsibilities ?? "",
    requirements: r.requirements ?? "",
    faqs: parseJson<FAQ[]>(r.faqs, []),
    screeningQuestions: parseJson<string[]>(r.screening_questions, []),
    hiringStages: parseJson<string[]>(r.hiring_stages, []),
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const JOB_COLUMNS = `
  id, title, company, category, location, remote, employment_type,
  salary_min, salary_max, bounty, description, responsibilities, requirements,
  faqs, screening_questions, hiring_stages, status, created_at, updated_at`;

export async function listOpenJobs(): Promise<Job[]> {
  const rows = await query<JobRow>(
    `SELECT ${JOB_COLUMNS} FROM jobs WHERE status = 'open'
      ORDER BY created_at DESC`,
  );
  return rows.map(toJob);
}

export async function listAllJobs(): Promise<Job[]> {
  const rows = await query<JobRow>(
    `SELECT ${JOB_COLUMNS} FROM jobs ORDER BY created_at DESC`,
  );
  return rows.map(toJob);
}

export async function getJob(id: string): Promise<Job | null> {
  const row = await queryOne<JobRow>(
    `SELECT ${JOB_COLUMNS} FROM jobs WHERE id = ?`,
    [id],
  );
  return row ? toJob(row) : null;
}

/** Public reads must never surface a draft or closed role. */
export async function getOpenJob(id: string): Promise<Job | null> {
  const row = await queryOne<JobRow>(
    `SELECT ${JOB_COLUMNS} FROM jobs WHERE id = ? AND status = 'open'`,
    [id],
  );
  return row ? toJob(row) : null;
}

export type JobWrite = {
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
  responsibilities: string;
  requirements: string;
  faqs: string;
  screeningQuestions: string;
  hiringStages: string;
  status: JobStatus;
};

export async function createJob(input: JobWrite, id = newId()): Promise<string> {
  await execute(
    `INSERT INTO jobs
       (id, title, company, category, location, remote, employment_type,
        salary_min, salary_max, bounty, description, responsibilities,
        requirements, faqs, screening_questions, hiring_stages, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, input.title, input.company, input.category, input.location,
      input.remote, input.employmentType, input.salaryMin, input.salaryMax,
      input.bounty, input.description, input.responsibilities,
      input.requirements, input.faqs, input.screeningQuestions,
      input.hiringStages, input.status,
    ],
  );
  return id;
}

export async function updateJob(id: string, input: JobWrite): Promise<boolean> {
  const result = await execute(
    `UPDATE jobs SET
       title = ?, company = ?, category = ?, location = ?, remote = ?,
       employment_type = ?, salary_min = ?, salary_max = ?, bounty = ?,
       description = ?, responsibilities = ?, requirements = ?, faqs = ?,
       screening_questions = ?, hiring_stages = ?, status = ?
     WHERE id = ?`,
    [
      input.title, input.company, input.category, input.location, input.remote,
      input.employmentType, input.salaryMin, input.salaryMax, input.bounty,
      input.description, input.responsibilities, input.requirements,
      input.faqs, input.screeningQuestions, input.hiringStages, input.status,
      id,
    ],
  );
  return result.affectedRows > 0;
}

export async function deleteJob(id: string): Promise<boolean> {
  const result = await execute("DELETE FROM jobs WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/* ----------------------------------------------------------- submissions */

type SubmissionRow = {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  recruiter_id: string | null;
  recruiter_name: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  notes: string | null;
  cv_file_id: string | null;
  cv_name: string | null;
  cv_type: string | null;
  cv_size: number | null;
  bounty: number | null;
  status: SubmissionStatus;
  created_at: string | null;
  /* Present only on the admin query, which joins users. Prefixed to keep them
     distinct from the submission's own denormalised recruiter_name. */
  r_uid?: string | null;
  r_name?: string | null;
  r_email?: string | null;
  r_phone?: string | null;
  r_company?: string | null;
  r_headline?: string | null;
  r_location?: string | null;
  r_linkedin?: string | null;
  r_photo_url?: string | null;
  r_created_at?: string | null;
};

/* cvUrl is generated, not stored: a fresh signed link is minted each time a
   submission is read. Because this only runs for a caller who was already
   allowed to read the row, download rights follow read rights — and the link
   expires on its own an hour later. */
function toSubmission(r: SubmissionRow): Submission {
  return {
    id: r.id,
    jobId: r.job_id,
    jobTitle: r.job_title,
    company: r.company,
    // "" rather than null keeps the existing client type unchanged.
    recruiterId: r.recruiter_id ?? "",
    recruiterName: r.recruiter_name,
    candidateName: r.candidate_name,
    candidateEmail: r.candidate_email,
    candidatePhone: r.candidate_phone,
    notes: r.notes ?? "",
    cvUrl: r.cv_file_id ? signedFileUrl(r.cv_file_id) : "",
    cvName: r.cv_name ?? "",
    cvType: r.cv_type ?? "",
    cvSize: r.cv_size,
    bounty: r.bounty,
    status: r.status,
    createdAt: r.created_at,
    /* Only the admin query selects these. `r_uid` is the tell: undefined means
       the query didn't ask for them, null means the recruiter row is genuinely
       gone (deleted account, or an open application with no referrer). */
    ...(r.r_uid === undefined
      ? {}
      : {
          recruiter: r.r_uid
            ? {
                uid: r.r_uid,
                name: r.r_name ?? "",
                email: r.r_email ?? "",
                phone: r.r_phone ?? "",
                company: r.r_company ?? "",
                headline: r.r_headline ?? "",
                location: r.r_location ?? "",
                linkedin: r.r_linkedin ?? "",
                photoURL: r.r_photo_url ?? "",
                createdAt: r.r_created_at ?? null,
              }
            : null,
        }),
  };
}

/* LEFT JOIN, not INNER: a submission whose CV row is somehow missing should
   still be readable — losing the candidate's contact details because the file
   vanished would be worse than showing the row without a download link. */
const SUB_COLUMNS = `
  s.id, s.job_id, s.job_title, s.company, s.recruiter_id, s.recruiter_name,
  s.candidate_name, s.candidate_email, s.candidate_phone, s.notes,
  s.cv_file_id, f.filename AS cv_name, f.content_type AS cv_type,
  f.byte_size AS cv_size, s.bounty, s.status, s.created_at`;

const SUB_FROM = `FROM submissions s LEFT JOIN files f ON f.id = s.cv_file_id`;

/* Admin-only additions: the referring recruiter's profile. LEFT JOIN again —
   a deleted recruiter sets submissions.recruiter_id to NULL, and that must not
   make the submission itself disappear from the screening queue. */
const SUB_RECRUITER_COLUMNS = `,
  u.uid AS r_uid, u.name AS r_name, u.email AS r_email, u.phone AS r_phone,
  u.company AS r_company, u.headline AS r_headline, u.location AS r_location,
  u.linkedin AS r_linkedin, u.photo_url AS r_photo_url,
  u.created_at AS r_created_at`;

const SUB_FROM_WITH_RECRUITER = `${SUB_FROM} LEFT JOIN users u ON u.uid = s.recruiter_id`;

export async function listSubmissionsByRecruiter(
  recruiterId: string,
): Promise<Submission[]> {
  const rows = await query<SubmissionRow>(
    `SELECT ${SUB_COLUMNS} ${SUB_FROM}
      WHERE s.recruiter_id = ? ORDER BY s.created_at DESC`,
    [recruiterId],
  );
  return rows.map(toSubmission);
}

/** Admin screening queue — every submission, with the referrer's profile. */
export async function listAllSubmissions(): Promise<Submission[]> {
  const rows = await query<SubmissionRow>(
    `SELECT ${SUB_COLUMNS}${SUB_RECRUITER_COLUMNS}
     ${SUB_FROM_WITH_RECRUITER} ORDER BY s.created_at DESC`,
  );
  return rows.map(toSubmission);
}

export type SubmissionWrite = {
  jobId: string;
  jobTitle: string;
  company: string;
  recruiterId: string | null;
  recruiterName: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  notes: string;
  cvFileId: string;
  bounty: number | null;
};

export async function createSubmission(
  input: SubmissionWrite,
  id = newId(),
): Promise<string> {
  await execute(
    `INSERT INTO submissions
       (id, job_id, job_title, company, recruiter_id, recruiter_name,
        candidate_name, candidate_email, candidate_phone, notes,
        cv_file_id, bounty, status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'submitted')`,
    [
      id, input.jobId, input.jobTitle, input.company, input.recruiterId,
      input.recruiterName, input.candidateName, input.candidateEmail,
      input.candidatePhone, input.notes, input.cvFileId, input.bounty,
    ],
  );
  return id;
}

/** True when the file exists, is a CV, and isn't already attached elsewhere. */
export async function cvFileIsAvailable(fileId: string): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM files f
      WHERE f.id = ? AND f.kind = 'cv'
        AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.cv_file_id = f.id)`,
    [fileId],
  );
  return (row?.n ?? 0) > 0;
}

export async function setSubmissionStatus(
  id: string,
  status: SubmissionStatus,
): Promise<boolean> {
  const result = await execute(
    "UPDATE submissions SET status = ? WHERE id = ?",
    [status, id],
  );
  return result.affectedRows > 0;
}

/* ----------------------------------------------------------------- users */

type UserRow = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  headline: string;
  location: string;
  linkedin: string;
  bio: string | null;
  photo_url: string;
  created_at: string | null;
};

function toUserProfile(r: UserRow): UserProfile {
  return {
    uid: r.uid,
    name: r.name,
    email: r.email,
    phone: r.phone,
    company: r.company,
    headline: r.headline,
    location: r.location,
    linkedin: r.linkedin,
    bio: r.bio ?? "",
    photoURL: r.photo_url,
    createdAt: r.created_at,
  };
}

const USER_COLUMNS = `
  uid, name, email, phone, company, headline, location, linkedin, bio,
  photo_url, created_at`;

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const row = await queryOne<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE uid = ?`,
    [uid],
  );
  return row ? toUserProfile(row) : null;
}

export async function listUsers(): Promise<UserProfile[]> {
  const rows = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC`,
  );
  return rows.map(toUserProfile);
}

/** Signup. Idempotent so a retried request can't fail on a duplicate key. */
export async function createUserProfile(
  uid: string,
  name: string,
  email: string,
): Promise<void> {
  await execute(
    `INSERT INTO users (uid, name, email) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email)`,
    [uid, name, email],
  );
}

/* Make sure a signed-in account has a profile row, and return it.
 *
 * A Firebase Auth account and a `users` row are created by two separate calls
 * at signup, so they can drift apart: the browser closes between them, the DB
 * is briefly unreachable, or the account predates this table. The result was a
 * login that reached the dashboard and found nothing — "No account profile
 * found", with no way forward.
 *
 * Unlike createUserProfile this is non-destructive: the ON DUPLICATE branch is
 * a deliberate no-op, so a concurrent request (or a returning user who has
 * since edited their name) can never have their profile overwritten by whatever
 * is stamped on the token. */
export async function ensureUserProfile(
  uid: string,
  name: string,
  email: string,
): Promise<UserProfile | null> {
  await execute(
    `INSERT INTO users (uid, name, email) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE uid = uid`,
    [uid, name, email],
  );
  return getUserProfile(uid);
}

export type ProfileWrite = {
  name: string;
  phone: string;
  company: string;
  headline: string;
  location: string;
  linkedin: string;
  bio: string;
  photoURL: string;
};

/* Note the columns absent here: uid, email and created_at. Those are identity
   and audit fields, and letting a profile PUT touch them would allow a user to
   rewrite their own audit trail. */
export async function updateUserProfile(
  uid: string,
  input: ProfileWrite,
): Promise<void> {
  await execute(
    `UPDATE users SET
       name = ?, phone = ?, company = ?, headline = ?, location = ?,
       linkedin = ?, bio = ?, photo_url = ?
     WHERE uid = ?`,
    [
      input.name, input.phone, input.company, input.headline, input.location,
      input.linkedin, input.bio, input.photoURL, uid,
    ],
  );
}

/* -------------------------------------------------------------- messages */

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string | null;
};

export async function createMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await execute(
    `INSERT INTO messages (name, email, subject, message) VALUES (?,?,?,?)`,
    [input.name, input.email, input.subject, input.message],
  );
}

export async function listMessages(): Promise<ContactMessage[]> {
  const rows = await query<{
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string | null;
    handled: number;
    created_at: string | null;
  }>(
    `SELECT id, name, email, subject, message, handled, created_at
       FROM messages ORDER BY created_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message ?? "",
    handled: Boolean(r.handled),
    createdAt: r.created_at,
  }));
}

/* -------------------------------------------------------------- settings */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await queryOne<{ value: unknown }>(
    "SELECT value FROM settings WHERE setting_key = ?",
    [key],
  );
  return row ? parseJson<T>(row.value, fallback) : fallback;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await execute(
    `INSERT INTO settings (setting_key, value) VALUES (?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [key, JSON.stringify(value)],
  );
}

/* ---------------------------------------------------------------- admins */

export async function countAdmins(): Promise<number> {
  const row = await queryOne<{ n: number }>("SELECT COUNT(*) AS n FROM admins");
  return row?.n ?? 0;
}

export async function createAdmin(uid: string, note = ""): Promise<void> {
  await execute(
    `INSERT INTO admins (uid, note) VALUES (?,?)
       ON DUPLICATE KEY UPDATE note = VALUES(note)`,
    [uid, note],
  );
}
