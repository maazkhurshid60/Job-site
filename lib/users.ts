import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

/* A single kind of self-serve user: they browse our jobs and submit
   candidates. (Admins are separate — the `admins/{uid}` list.) */
export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  createdAt: Timestamp | null;
};

export async function createUserProfile(
  uid: string,
  data: { name: string; email: string },
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    name: data.name,
    email: data.email,
    createdAt: serverTimestamp(),
  });
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
  const d = snap.data();
  return {
    uid,
    name: (d.name as string) ?? "",
    email: (d.email as string) ?? "",
    createdAt: (d.createdAt as Timestamp) ?? null,
  };
}
