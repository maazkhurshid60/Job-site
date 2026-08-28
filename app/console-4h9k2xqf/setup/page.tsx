"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { bootstrapAdmin, bootstrapAvailable } from "@/lib/users";
import { adminRoutes } from "@/lib/routes";
import { Logo } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";
import { Loader } from "@/components/Loader";

/* TEMPORARY bootstrap page — creates the first admin account and grants it
   admin rights, then signs in. Delete this route once your admin exists. */
export default function AdminSetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // The API already refuses once an admin exists — this just means the form
  // itself says so up front, instead of only after someone fills it in and
  // submits into a 403.
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    bootstrapAvailable()
      .then((a) => active && setAvailable(a))
      .catch(() => active && setAvailable(true)); // fail open to the form, not a false "closed"
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      // Create the auth user, or sign in if it already exists.
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setNote("Account created.");
      } catch (err) {
        if (
          err instanceof FirebaseError &&
          err.code === "auth/email-already-in-use"
        ) {
          await signInWithEmailAndPassword(auth, email, password);
          setNote("Existing account — signed in.");
        } else {
          throw err;
        }
      }

      /* Grant admin. The server takes the uid from the verified token and
         refuses once any admin exists, so this closes itself — unlike the old
         Firestore rule, which stayed open until someone remembered to edit it. */
      await bootstrapAdmin();

      router.replace(adminRoutes.base);
    } catch (err) {
      setError(explain(err));
      setBusy(false);
    }
  }

  if (available === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Loader />
      </div>
    );
  }

  if (available === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_24px_60px_-30px_rgba(23,19,15,0.25)]">
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              Setup already complete
            </h1>
            <p className="mt-2 text-sm text-muted">
              An admin account already exists, so this page is closed. Sign in
              from the console login instead.
            </p>
            <a
              href={adminRoutes.login}
              className="mt-6 inline-block w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Go to console login
            </a>
          </div>
        </div>
      </div>
    );
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
              <PasswordInput
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
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
      default:
        return err.message;
    }
  }
  // Bootstrap refusals ("An admin already exists") arrive as plain Errors.
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}
