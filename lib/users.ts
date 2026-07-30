import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";
import { apiFetch } from "./api";

/* Recruiter profiles. Rows live in MySQL; avatar images still live in Firebase
   Storage, so uploadAvatar is unchanged and returns a Storage download URL that
   the profile row then stores. */

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
  bio: string;
  photoURL: string;
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
};

/* The fields a recruiter can edit on their profile (everything except the
   identity/audit fields, which the server refuses to update). */
export type UserProfileInput = {
  name: string;
  phone: string;
  company: string;
  headline: string;
  location: string;
  linkedin: string;
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

/* Recruiter action: upload a profile photo and return its download URL.
   Stored under `avatars/{uid}/…` so a user only ever writes to their space. */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  if (file.size > MAX_AVATAR_BYTES)
    throw new Error("Image is larger than 5 MB.");
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type))
    throw new Error("Image must be a JPG, PNG, or WebP.");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `avatars/${uid}/${Date.now()}-${safeName}`;
  const snap = await uploadBytes(ref(storage, path), file, {
    contentType: file.type,
  });
  return getDownloadURL(snap.ref);
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
