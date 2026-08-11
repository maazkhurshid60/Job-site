"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  createSubmission, listSubmissionsByRecruiter, submissionRef,
  SUBMISSION_STATUS_LABEL, type Submission,
} from "@/lib/submissions";
import { ACCEPTED_CV_TYPES, MAX_CV_BYTES } from "@/lib/cv";
import { feeTierMeta } from "@/lib/feeTiers";
import { formatDate } from "@/lib/dates";
import type { Job } from "@/lib/jobs";

const MAX_CANDIDATES = 10;

type CandidateDraft = {
  key: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  notes: string;
  cv: File | null;
};

function emptyDraft(): CandidateDraft {
  return {
    key: crypto.randomUUID(),
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    notes: "",
    cv: null,
  };
}

type SubmitOutcome = { name: string; ok: boolean; error?: string; id?: string };

export function SubmitCandidateForm({ job }: { job: Job }) {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useAuth();

  const [drafts, setDrafts] = useState<CandidateDraft[]>([emptyDraft()]);
  const [hp, setHp] = useState(""); // honeypot — real users leave this empty
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcomes, setOutcomes] = useState<SubmitOutcome[] | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  /* This recruiter's own prior submissions for THIS job — so re-visiting a
     role they've already referred candidates for shows that, instead of
     looking like a blank slate. Fetched client-side from their own list (the
     API has no per-job filter, and this list is never large enough to need
     one); admins never reach this component, so no extra request is wasted
     on them. */
  const [priorSubmissions, setPriorSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (!user || isAdmin) return;
    let active = true;
    listSubmissionsByRecruiter()
      .then((all) => {
        if (active) setPriorSubmissions(all.filter((s) => s.jobId === job.id));
      })
      .catch(() => {}); // non-critical — the form still works without it
    return () => {
      active = false;
    };
  }, [user, isAdmin, job.id]);

  function updateDraft(key: string, patch: Partial<CandidateDraft>) {
    setDrafts((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addDraft() {
    setDrafts((rows) =>
      rows.length >= MAX_CANDIDATES ? rows : [...rows, emptyDraft()],
    );
  }

  function removeDraft(key: string) {
    setDrafts((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));
  }

  function submitMore() {
    setDrafts([emptyDraft()]);
    setError(null);
    setOutcomes(null);
    setSubmittedAt(null);
  }

  /** One row's problem, or null if it's ready to send. Checked before any
      network call so an obviously incomplete row never starts an upload. */
  function draftProblem(d: CandidateDraft): string | null {
    if (!d.candidateName.trim()) return "Candidate name is required.";
    if (!d.candidateEmail.trim()) return "Candidate email is required.";
    if (!d.candidatePhone.trim()) return "Candidate phone is required.";
    if (!d.cv) return "Please attach the candidate's CV.";
    if (!ACCEPTED_CV_TYPES.includes(d.cv.type)) return "CV must be a PDF or Word document.";
    if (d.cv.size > MAX_CV_BYTES) return "CV is larger than 10 MB.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Bot filled the hidden field — pretend success, write nothing.
    if (hp) {
      setOutcomes(drafts.map((d) => ({ name: d.candidateName || "Candidate", ok: true })));
      setSubmittedAt(new Date().toISOString());
      return;
    }
    /* The form is only rendered for a signed-in, non-admin user, but a session
       can expire while it sits open. Catch that here rather than letting the
       upload start and fail with a 401 halfway through. */
    if (!user) {
      setError("Your session has ended. Please sign in again to submit.");
      return;
    }

    for (const d of drafts) {
      const problem = draftProblem(d);
      if (problem) {
        setError(
          drafts.length > 1
            ? `${d.candidateName || "One candidate"}: ${problem}`
            : problem,
        );
        return;
      }
    }

    setSubmitting(true);
    // Sequential, not Promise.all: each row uploads a CV then creates a row,
    // and running ten of those at once against a three-connection MySQL pool
    // would starve every other request the site is serving.
    const results: SubmitOutcome[] = [];
    for (const d of drafts) {
      try {
        const { id } = await createSubmission(
          job,
          { uid: user.uid, name: profile?.name || user.displayName || "Recruiter" },
          d,
          d.cv as File,
        );
        results.push({ name: d.candidateName, ok: true, id });
      } catch (err) {
        /* Show what actually failed. The API returns readable messages —
           "This candidate has already been submitted for this role.",
           "CV must be a PDF or Word document." — and apiFetch passes them
           through, so the recruiter can act on it instead of guessing. */
        results.push({
          name: d.candidateName,
          ok: false,
          error: err instanceof Error && err.message ? err.message : "Could not save this submission.",
        });
      }
    }
    setOutcomes(results);
    setSubmittedAt(new Date().toISOString());
    // Refresh so the "already submitted" banner includes what just landed —
    // best-effort, the confirmation screen already shows the same names.
    listSubmissionsByRecruiter()
      .then((all) => setPriorSubmissions(all.filter((s) => s.jobId === job.id)))
      .catch(() => {});
    // finally, not catch: a stuck "Submitting…" is the worst outcome here.
    setSubmitting(false);
  }

  // Wait for auth to resolve before deciding what to show, so a signed-in
  // recruiter never sees the sign-in prompt flash on load.
  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8">
        <div className="h-5 w-40 animate-pulse rounded bg-line" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-line" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-line" />
      </div>
    );
  }

  /* Signed-out visitors get no form at all. This is presentation only — the
     real rule is requireUid() on POST /api/submissions and POST /api/files. */
  if (!user) {
    const next = encodeURIComponent(`/jobs/${job.id}`);
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">
          Sign in to submit a candidate
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Referrals are tied to your account — that&apos;s how we know the{" "}
          {job.feeTier ? "fee" : "referral"} is yours when{" "}
          {job.title} is filled. It&apos;s free to join.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={`/login?next=${next}`}
            className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Log in
          </Link>
          <Link
            href={`/signup?next=${next}`}
            className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  /* Admins screen and decide every submission — including their own, if they
     could make one. The real block is on the server (POST /api/submissions);
     this just keeps the console gate from offering an action that's a
     conflict of interest to begin with. */
  if (isAdmin) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <h3 className="text-lg font-bold text-ink">Submissions are recruiter-only</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Admin accounts screen candidates, so they can&apos;t also refer them
          for {job.title}.
        </p>
      </div>
    );
  }

  if (outcomes) {
    const succeeded = outcomes.filter((o) => o.ok);
    const failed = outcomes.filter((o) => !o.ok);
    const fee = feeTierMeta(job.feeTier);
    const single = succeeded.length === 1 ? succeeded[0] : null;

    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4 10-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">
          {failed.length === 0
            ? succeeded.length > 1
              ? `${succeeded.length} candidates submitted`
              : "Candidate submitted"
            : "Submission complete"}
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Our team will screen {succeeded.length === 1 ? succeeded[0].name || "your candidate" : "each candidate"} for{" "}
          <span className="font-medium text-ink">{job.title}</span> and update
          the status in your submissions.
        </p>

        {single && (
          <dl className="mx-auto mt-5 max-w-sm space-y-2 rounded-xl border border-line bg-cream/40 p-4 text-left text-sm">
            <ConfirmRow label="Candidate" value={single.name || "Candidate"} />
            <ConfirmRow label="Position" value={job.title} />
            <ConfirmRow
              label="Recruiter fee"
              value={fee ? `$${fee.amount.toLocaleString()}` : "No fee tier set"}
            />
            <ConfirmRow label="Submitted" value={formatDate(submittedAt)} />
            <ConfirmRow label="Status" value={SUBMISSION_STATUS_LABEL.submitted} />
            {single.id && (
              <ConfirmRow label="Submission ID" value={submissionRef(single.id)} mono />
            )}
          </dl>
        )}

        {outcomes.length > 1 && (
          <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm">
            {outcomes.map((o, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={o.ok ? "text-primary" : "text-coral"}>
                  {o.ok ? "✓" : "✕"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-ink">
                    <span>{o.name || "Candidate"}</span>
                    {o.ok && o.id && (
                      <span className="shrink-0 font-mono text-xs text-muted">
                        {submissionRef(o.id)}
                      </span>
                    )}
                  </span>
                  {!o.ok && <span className="block text-xs text-coral">{o.error}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={submitMore}
            className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Submit more candidates
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/submissions")}
            className="rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream"
          >
            View my submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {priorSubmissions.length > 0 && (
        <div className="rounded-2xl border border-primary/25 bg-primary-soft p-4">
          <p className="text-sm font-bold text-primary">
            You&apos;ve already submitted {priorSubmissions.length}{" "}
            {priorSubmissions.length === 1 ? "candidate" : "candidates"} for this role
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {priorSubmissions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span>{s.candidateName || "Candidate"}</span>
                <span className="text-xs font-semibold text-primary">
                  {SUBMISSION_STATUS_LABEL[s.status]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-primary/80">
            You can still submit more candidates for this role below.
          </p>
        </div>
      )}

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

      <div className="mt-5 space-y-6">
        {drafts.map((d, i) => (
          <div key={d.key} className={drafts.length > 1 ? "rounded-xl border border-line p-4" : ""}>
            {drafts.length > 1 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">
                  Candidate {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeDraft(d.key)}
                  className="text-xs font-semibold text-muted hover:text-coral"
                >
                  Remove
                </button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Candidate name">
                <input
                  className="input"
                  required
                  value={d.candidateName}
                  onChange={(e) => updateDraft(d.key, { candidateName: e.target.value })}
                  placeholder="Jordan Lee"
                />
              </Field>
              <Field label="Candidate email">
                <input
                  className="input"
                  type="email"
                  required
                  value={d.candidateEmail}
                  onChange={(e) => updateDraft(d.key, { candidateEmail: e.target.value })}
                  placeholder="jordan@email.com"
                />
              </Field>
              <Field label="Candidate phone" className="sm:col-span-2">
                <input
                  className="input"
                  type="tel"
                  required
                  value={d.candidatePhone}
                  onChange={(e) => updateDraft(d.key, { candidatePhone: e.target.value })}
                  placeholder="+44 7700 900000"
                />
              </Field>
              <Field label="Why they're a fit (optional)" className="sm:col-span-2">
                <textarea
                  className="input min-h-28 resize-y"
                  value={d.notes}
                  onChange={(e) => updateDraft(d.key, { notes: e.target.value })}
                  placeholder="A short pitch for this candidate…"
                />
              </Field>
              <Field label="CV (PDF or Word, max 10 MB)" className="sm:col-span-2">
                <input
                  className="block w-full text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => updateDraft(d.key, { cv: e.target.files?.[0] ?? null })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addDraft}
        disabled={drafts.length >= MAX_CANDIDATES}
        className="mt-4 w-full rounded-xl border border-dashed border-line py-2.5 text-sm font-semibold text-primary hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {drafts.length >= MAX_CANDIDATES
          ? `Up to ${MAX_CANDIDATES} candidates per submission`
          : "+ Add another candidate"}
      </button>

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
        {submitting
          ? "Submitting…"
          : drafts.length > 1
            ? `Submit ${drafts.length} candidates`
            : "Submit candidate"}
      </button>
    </form>
    </div>
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

function ConfirmRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`min-w-0 truncate text-right font-semibold text-ink ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
