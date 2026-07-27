"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { adminRoutes } from "@/lib/routes";
import { Logo } from "@/components/Logo";

/* TEMPORARY bootstrap page — creates the first admin account and grants it
   admin rights, then signs in. Delete this route once your admin exists. */
export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      // Create the auth user, or sign in if it already exists.
      let uid: string;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        setNote("Account created.");
      } catch (err) {
        if (
          err instanceof FirebaseError &&
          err.code === "auth/email-already-in-use"
        ) {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          uid = cred.user.uid;
          setNote("Existing account — signed in.");
        } else {
          throw err;
        }
      }

      // Grant admin by writing the allow-list doc.
      await setDoc(
        doc(db, "admins", uid),
        { email, createdAt: serverTimestamp() },
        { merge: true },
      );

      router.replace(adminRoutes.base);
    } catch (err) {
      setError(explain(err));
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-white px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="mb-4 rounded-xl border border-coral/40 bg-coral-soft px-4 py-3 text-xs text-coral">
          <strong>Temporary setup.</strong> Use this once to create your admin,
          then delete this page and lock the rules (see the note below).
        </div>

        <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_24px_60px_-30px_rgba(23,19,15,0.25)]">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            Create admin
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sets up your first JobFolder admin account.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@jobfolder.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="At least 6 characters"
              />
            </label>

            {note && (
              <p className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
                {note}
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {busy ? "Setting up…" : "Create admin & sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function explain(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/operation-not-allowed":
        return "Enable Email/Password sign-in in the Firebase console first.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/invalid-email":
        return "That email looks invalid.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "That email exists but the password doesn't match.";
      case "permission-denied":
        return "Firestore blocked the admin write — publish the temporary bootstrap rule (see instructions).";
      default:
        return err.message;
    }
  }
  return "Something went wrong. Please try again.";
}
