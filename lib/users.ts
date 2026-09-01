import { apiFetch, uploadFile } from "./api";

/* Recruiter profiles. Rows and avatar images both live in MySQL — the image
   bytes go into the `files` table and photoURL holds the /api/files/{id} path
   that serves them. */

/* A single kind of self-serve user: a recruiter. They browse our jobs and
   submit / refer their candidates. (Admins are separate — the `admins` table.)
   A recruiter fills out a richer profile — including a photo — which admins can
   review from the console. */
export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  headline: string; // e.g. "Technical recruiter" / job title
  location: string;
  linkedin: string;
  website: string;
  twitter: string;
  facebook: string;
  instagram: string;
  bio: string;
  photoURL: string;
  /** Admin-set: shows this recruiter on Metro Associates' public team page. */
  metroTeamMember: boolean;
  /** Admin-set: whether this recruiter has been vetted. An unverified
      recruiter can browse and use the dashboard, but POST /api/submissions
      refuses to create a submission on their behalf until this is true. */
  verified: boolean;
  /** Admin-set: a hard stop for a bad-actor account. Blocks every write —
      submissions, saved candidates, messages, file uploads. They can still
      sign in and see the dashboard, which is what shows them the notice. */
  suspended: boolean;
  /** Admin-set: unlocks the self-serve recruiter-website builder on
      /dashboard/career-site. */
  siteBuilderEnabled: boolean;
  /** When an admin last sent the "complete your profile" reminder email, or
      null if never. Informational only — nothing enforces a cooldown. */
  profileReminderSentAt: string | null;
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
};

/** One row on the console's admin allow-list. name/email come from a matching
    recruiter profile when one exists — an admin doesn't have to also be a
    recruiter, so both can be empty. */
export type AdminAccount = {
  uid: string;
  note: string;
  name: string;
  email: string;
  createdAt: string | null;
  /** Stamped whenever this admin loads the console — null if never. */
  lastActiveAt: string | null;
};

/** Admin access granted to an email with no account yet. Turns into a real
    AdminAccount automatically the moment that email signs in. */
export type AdminInvite = {
  email: string;
  invitedByName: string;
  invitedByEmail: string;
  createdAt: string | null;
};

export type AdminAuditAction =
  | "grant"
  | "revoke"
  | "invite"
  | "invite_claimed"
  | "invite_cancelled"
  | "recruiter_verified"
  | "recruiter_unverified"
  | "recruiter_suspended"
  | "recruiter_reinstated"
  | "site_builder_unlocked"
  | "site_builder_locked"
  | "job_deleted"
  | "jobs_synced"
  | "submission_status_changed"
  | "profile_reminder_sent";

/** One entry in the admin action history — every sensitive action taken from
    the console, not just changes to the admin allow-list. */
export type AdminAuditEntry = {
  id: number;
  action: AdminAuditAction;
  actorName: string;
  actorEmail: string;
  targetName: string;
  targetEmail: string;
  details: string | null;
  createdAt: string | null;
};

/** What POST /api/admin/admins returns: either the account was granted
    immediately (it already existed), or an invite is now pending. */
export type AdminAccessGrant =
  | { kind: "admin"; admin: AdminAccount }
  | { kind: "invite"; invite: AdminInvite };

/* The fields a recruiter can edit on their profile (everything except the
   identity/audit fields, which the server refuses to update). */
export type UserProfileInput = {
  name: string;
  phone: string;
  company: string;
  headline: string;
  location: string;
  linkedin: string;
  website: string;
  twitter: string;
  facebook: string;
  instagram: string;
  bio: string;
  photoURL: string;
};

/** What GET /api/me returns: the profile plus the caller's admin status. */
export type Me = { profile: UserProfile | null; isAdmin: boolean };

/** One round trip for both — the dashboard and console both need each. */
export function getMe(): Promise<Me> {
  return apiFetch<Me>("/api/me", { auth: true });
}

/* Called right after Firebase Auth creates the account. The server takes the
   uid from the verified token, so the `uid` argument is accepted only to keep
   existing call sites compiling. */
export async function createUserProfile(
  _uid: string,
  data: { name: string; email: string },
): Promise<void> {
  await apiFetch("/api/me", { method: "POST", body: data, auth: true });
}

/* Recruiter action: update the editable parts of their own profile. A user can
   only ever update their own — the server ignores any uid in the body. */
export async function updateUserProfile(
  _uid: string,
  data: Partial<UserProfileInput>,
): Promise<void> {
  await apiFetch("/api/me", { method: "PUT", body: data, auth: true });
}

/* Recruiter action: upload a profile photo and return the URL that serves it.
   The server records the uploader from the token, so a user can only ever
   attach an avatar to their own account. */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAvatar(_uid: string, file: File): Promise<string> {
  // Checked again server-side; this is just a fast, friendly failure.
  if (file.size > MAX_AVATAR_BYTES)
    throw new Error("Image is larger than 5 MB.");
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type))
    throw new Error("Image must be a JPG, PNG, or WebP.");

  const { url } = await uploadFile(file, "avatar");
  if (!url) throw new Error("Upload succeeded but returned no URL.");
  return url;
}

/* True when the signed-in user is on the admin allow-list. Always asks about
   the caller — an arbitrary uid is not answerable client-side, and shouldn't
   be. Prefer `useAuth().isAdmin`, which reuses the profile fetch. */
export async function isAdminUser(): Promise<boolean> {
  try {
    return (await getMe()).isAdmin;
  } catch {
    return false;
  }
}

/** The caller's own profile. */
export async function getUserProfile(): Promise<UserProfile | null> {
  return (await getMe()).profile;
}

/** Admin action: list every recruiter, newest first. */
export function listAllUsers(): Promise<UserProfile[]> {
  return apiFetch<UserProfile[]>("/api/admin/recruiters", { auth: true });
}

/** Admin action: add or remove a recruiter from Metro Associates' public team
    page. Approving here is what the "Meet Our Team" page on the Metro site
    fetches — see /api/team. */
export async function setRecruiterMetroTeamMember(
  uid: string,
  metroTeamMember: boolean,
): Promise<void> {
  await apiFetch(`/api/admin/recruiters/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: { metroTeamMember },
    auth: true,
  });
}

/** Admin action: vet a recruiter, or reverse that. Until this is true, they
    can't submit a candidate — see POST /api/submissions. */
export async function setRecruiterVerified(
  uid: string,
  verified: boolean,
): Promise<void> {
  await apiFetch(`/api/admin/recruiters/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: { verified },
    auth: true,
  });
}

/** Admin action: suspend a recruiter account, or reinstate it. A suspended
    account is blocked from every write action (submitting candidates, saved
    candidates, messages, file uploads) — see lib/server/auth.ts. */
export async function setRecruiterSuspended(
  uid: string,
  suspended: boolean,
): Promise<void> {
  await apiFetch(`/api/admin/recruiters/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: { suspended },
    auth: true,
  });
}

/** Admin action: unlock (or lock) the free recruiter-website builder for this
    recruiter — a perk normally granted after their first placement. */
export async function setRecruiterSiteBuilderEnabled(
  uid: string,
  siteBuilderEnabled: boolean,
): Promise<void> {
  await apiFetch(`/api/admin/recruiters/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: { siteBuilderEnabled },
    auth: true,
  });
}

/** Admin action: email this recruiter a reminder to finish their profile.
    Refused server-side if the profile is already complete. */
export async function sendProfileReminder(uid: string): Promise<void> {
  await apiFetch(`/api/admin/recruiters/${encodeURIComponent(uid)}/remind-profile`, {
    method: "POST",
    auth: true,
  });
}

/** Bootstrap the first admin (used by the /setup page). */
export async function bootstrapAdmin(): Promise<void> {
  await apiFetch("/api/admin/bootstrap", { method: "POST", auth: true });
}

/** Whether first-admin bootstrap is still available. */
export async function bootstrapAvailable(): Promise<boolean> {
  const { available } = await apiFetch<{ available: boolean }>(
    "/api/admin/bootstrap",
  );
  return available;
}

/** Admin action: the console's admin allow-list, plus any pending invites. */
export function listAdminAccess(): Promise<{ admins: AdminAccount[]; invites: AdminInvite[] }> {
  return apiFetch<{ admins: AdminAccount[]; invites: AdminInvite[] }>(
    "/api/admin/admins",
    { auth: true },
  );
}

/** Admin action: grant admin access to whoever holds this email. If an
    account with that email already exists, access is granted immediately.
    Otherwise an invite is created — it auto-activates the moment that email
    signs in. */
export async function addAdmin(email: string): Promise<AdminAccessGrant> {
  return apiFetch<AdminAccessGrant>("/api/admin/admins", {
    method: "POST",
    body: { email },
    auth: true,
  });
}

/** Admin action: revoke admin access. The server refuses to remove the last
    remaining admin — see DELETE /api/admin/admins/[uid]. */
export async function removeAdmin(uid: string): Promise<void> {
  await apiFetch(`/api/admin/admins/${encodeURIComponent(uid)}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Admin action: cancel a pending invite before it's claimed. */
export async function cancelAdminInvite(email: string): Promise<void> {
  await apiFetch(`/api/admin/invites/${encodeURIComponent(email)}`, {
    method: "DELETE",
    auth: true,
  });
}

/** Admin action: history of every grant/revoke/invite against the allow-list. */
export function listAdminAuditLog(): Promise<AdminAuditEntry[]> {
  return apiFetch<AdminAuditEntry[]>("/api/admin/audit-log", { auth: true });
}
