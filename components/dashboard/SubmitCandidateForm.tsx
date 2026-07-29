"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createSubmission } from "@/lib/submissions";
import { ACCEPTED_CV_TYPES, MAX_CV_BYTES } from "@/lib/cv";
import type { Job } from "@/lib/jobs";

export function SubmitCandidateForm({ job }: { job: Job }) {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    notes: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [hp, setHp] = useState(""); // honeypot — real users leave this empty
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Bot filled the hidden field — pretend success, write nothing.
    if (hp) {
      setDone(true);
      return;
    }
    if (!cv) {
      setError("Please attach the candidate's CV.");
      return;
    }
    if (!ACCEPTED_CV_TYPES.includes(cv.type)) {
      setError("CV must be a PDF or Word document.");
      return;
    }
    if (cv.size > MAX_CV_BYTES) {
      setError("CV is larger than 10 MB.");
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission(
        job,
        user
          ? { uid: user.uid, name: profile?.name || user.displayName || "Recruiter" }
          : null,
        form,
        cv,
      );
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit. Try again.",
      );
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4 10-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">Candidate submitted</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Our team will screen {form.candidateName || "your candidate"} for{" "}
          <span className="font-medium text-ink">{job.title}</span> and update
          the status in your submissions.
        </p>
        <button
          type="button"
          onClick={() => router.push(user ? "/dashboard/submissions" : "/jobs")}
          className="mt-5 rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          {user ? "View my submissions" : "Browse more jobs"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-white p-6">
      {/* honeypot — hidden from real users; bots that fill it are dropped */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <h3 className="text-lg font-bold text-ink">Submit a candidate</h3>
      <p className="mt-1 text-sm text-muted">
        Your candidate goes to our screening team, not the client directly.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Candidate name">
          <input
            className="input"
            required
            value={form.candidateName}
            onChange={(e) => set("candidateName", e.target.value)}
            placeholder="Jordan Lee"
          />
        </Field>
        <Field label="Candidate email">
          <input
            className="input"
            type="email"
            required
            value={form.candidateEmail}
            onChange={(e) => set("candidateEmail", e.target.value)}
            placeholder="jordan@email.com"
          />
        </Field>
        <Field label="Candidate phone" className="sm:col-span-2">
          <input
            className="input"
            type="tel"
            required
            value={form.candidatePhone}
            onChange={(e) => set("candidatePhone", e.target.value)}
            placeholder="+44 7700 900000"
          />
        </Field>
        <Field label="Why they're a fit (optional)" className="sm:col-span-2">
          <textarea
            className="input min-h-28 resize-y"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="A short pitch for this candidate…"
          />
        </Field>
        <Field label="CV (PDF or Word, max 10 MB)" className="sm:col-span-2">
          <input
            className="block w-full text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
            type="file"
            required
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCv(e.target.files?.[0] ?? null)}
          />
        </Field>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Submitting…" : "Submit candidate"}
      </button>
    </form>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
