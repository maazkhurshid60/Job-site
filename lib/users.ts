import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";

/* A single kind of self-serve user: a recruiter. They browse our jobs and
   submit / refer their candidates. (Admins are separate — the `admins/{uid}`
   list.) A recruiter fills out a richer profile — including a photo — which
   admins can review from the console. */
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
  createdAt: Timestamp | null;
};

/* The fields a recruiter can edit on their profile (everything except the
   identity/audit fields). */
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

const usersCol = collection(db, "users");

function toUserProfile(uid: string, d: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: (d.name as string) ?? "",
    email: (d.email as string) ?? "",
    phone: (d.phone as string) ?? "",
    company: (d.company as string) ?? "",
    headline: (d.headline as string) ?? "",
    location: (d.location as string) ?? "",
    linkedin: (d.linkedin as string) ?? "",
    bio: (d.bio as string) ?? "",
    photoURL: (d.photoURL as string) ?? "",
    createdAt: (d.createdAt as Timestamp) ?? null,
  };
}

export async function createUserProfile(
  uid: string,
  data: { name: string; email: string },
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    name: data.name,
    email: data.email,
    phone: "",
    company: "",
    headline: "",
    location: "",
    linkedin: "",
    bio: "",
    photoURL: "",
    createdAt: serverTimestamp(),
  });
}

/* Recruiter action: update the editable parts of their own profile.
   Merges so identity/audit fields (email, createdAt) are preserved. */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfileInput>,
): Promise<void> {
  await setDoc(doc(db, "users", uid), data, { merge: true });
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

/* True when the signed-in user is on the admin allow-list (`admins/{uid}`).
   Rules let a user read their own admin doc, so this works client-side. */
export async function isAdminUser(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return toUserProfile(uid, snap.data());
}

/* Admin action: list every recruiter, newest first. Requires admin read
   access to the `users` collection (see firestore.rules). */
export async function listAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(query(usersCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => toUserProfile(d.id, d.data()));
}
