"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  createSubmission, listSubmissionsByRecruiter, submissionRef,
  SUBMISSION_STATUS_LABEL, type Submission,
} from "@/lib/submissions";
import { listCandidates, quickApply, type SavedCandidate } from "@/lib/candidates";
import { ACCEPTED_CV_TYPES, MAX_CV_BYTES } from "@/lib/cv";
import { feeTierMeta } from "@/lib/feeTiers";
import { formatDate } from "@/lib/dates";
import type { Job } from "@/lib/jobs";

type CandidateDraft = {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLinkedin: string;
  notes: string;
  cv: File | null;
  photo: File | null;
};

function emptyDraft(): CandidateDraft {
  return {
    candidateName: "", candidateEmail: "", candidatePhone: "", candidateLinkedin: "",
    notes: "", cv: null, photo: null,
  };
}

type Step = 1 | 2 | 3;
const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Candidate" },
  { n: 2, label: "Additional" },
  { n: 3, label: "Review" },
];

type SubmitOutcome = { ok: boolean; error?: string; id?: string };

export function SubmitCandidateForm({ job }: { job: Job }) {
  const router = useRouter();
  const {
    user, profile, loading, isAdmin,
    emailVerified, resendVerificationEmail, checkEmailVerified,
  } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<CandidateDraft>(emptyDraft());
  const [hp, setHp] = useState(""); // honeypot — real users leave this empty
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [checkingVerified, setCheckingVerified] = useState(false);
  const [stillUnverified, setStillUnverified] = useState(false);

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

  /* The recruiter's saved candidate pool — applying one to a role happens
     here, on the job itself, not from the pool's own list (that list is
     save/edit/delete only). One click reuses their saved name/email/phone
     and clones their CV, no retyping — an alternative to the step form below. */
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || isAdmin || !profile?.verified) return;
    let active = true;
    listCandidates()
      .then((all) => active && setSavedCandidates(all))
      .catch(() => {}); // non-critical — the form still works without it
    return () => {
      active = false;
    };
  }, [user, isAdmin, profile?.verified]);

  async function applySaved(candidate: SavedCandidate) {
    setApplyingId(candidate.id);
    setApplyError(null);
    try {
      await quickApply(job.id, candidate.id, "");
      setAppliedIds((ids) => new Set(ids).add(candidate.id));
      listSubmissionsByRecruiter()
        .then((all) => setPriorSubmissions(all.filter((s) => s.jobId === job.id)))
        .catch(() => {});
    } catch (err) {
      setApplyError(err instanceof Error && err.message ? err.message : "Could not apply this candidate.");
    } finally {
      setApplyingId(null);
    }
  }

  function updateDraft(patch: Partial<CandidateDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function step1Problem(d: CandidateDraft): string | null {
    if (!d.candidateName.trim()) return "Candidate name is required.";
    if (!d.candidateEmail.trim()) return "Candidate email is required.";
    if (!d.candidatePhone.trim()) return "Candidate phone is required.";
    return null;
  }

  function step2Problem(d: CandidateDraft): string | null {
    if (!d.cv) return "Please attach the candidate's CV.";
    if (!ACCEPTED_CV_TYPES.includes(d.cv.type)) return "CV must be a PDF or Word document.";
    if (d.cv.size > MAX_CV_BYTES) return "CV is larger than 10 MB.";
    return null;
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault();
    const problem = step1Problem(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep(2);
  }

  function goToStep3(e: React.FormEvent) {
    e.preventDefault();
    const problem = step2Problem(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep(3);
  }

  function startOver() {
    setDraft(emptyDraft());
    setStep(1);
    setError(null);
    setOutcome(null);
    setSubmittedAt(null);
  }

  async function onSubmit() {
    setError(null);

    // Bot filled the hidden field — pretend success, write nothing.
    if (hp) {
      setOutcome({ ok: true });
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

    setSubmitting(true);
    try {
      const { id } = await createSubmission(
        job,
        { uid: user.uid, name: profile?.name || user.displayName || "Recruiter" },
        draft,
        draft.cv as File,
        draft.photo,
      );
      setOutcome({ ok: true, id });
      setSubmittedAt(new Date().toISOString());
      // Refresh so the "already submitted" banner includes what just landed.
      listSubmissionsByRecruiter()
        .then((all) => setPriorSubmissions(all.filter((s) => s.jobId === job.id)))
        .catch(() => {});
    } catch (err) {
      /* Show what actually failed, on the review step rather than navigating
         away from it. The API returns readable messages — "This candidate
         has already been submitted for this role.", "CV must be a PDF or
         Word document." — and apiFetch passes them through, so the recruiter
         can act on it instead of guessing. */
      setError(
        err instanceof Error && err.message ? err.message : "Could not save this submission.",
      );
    } finally {
      // finally, not catch: a stuck "Submitting…" is the worst outcome here.
      setSubmitting(false);
    }
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

  /* Signed in but hasn't clicked the link in their verification email.
     Presentation only, same as the gates above — POST /api/submissions
     enforces this server-side via requireVerifiedUid(). */
  if (!emailVerified) {
    async function handleResend() {
      setResendState("sending");
      try {
        await resendVerificationEmail();
        setResendState("sent");
      } catch {
        setResendState("error");
      }
    }
    async function handleRecheck() {
      setCheckingVerified(true);
      setStillUnverified(false);
      try {
        const verified = await checkEmailVerified();
        if (!verified) setStillUnverified(true);
      } finally {
        setCheckingVerified(false);
      }
    }
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">Verify your email to submit</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          We sent a verification link to{" "}
          <span className="font-medium text-ink">{user.email}</span>. Click
          it, then continue here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleRecheck}
            disabled={checkingVerified}
            className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {checkingVerified ? "Checking…" : "I've verified — continue"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === "sending"}
            className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {resendState === "sending" ? "Sending…" : "Resend email"}
          </button>
        </div>
        {stillUnverified && (
          <p className="mx-auto mt-3 max-w-sm rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
            Still not verified. Check your inbox (and spam folder) for the link.
          </p>
        )}
        {resendState === "sent" && (
          <p className="mx-auto mt-3 max-w-sm rounded-lg bg-sage-soft px-3 py-2 text-sm text-ink">
            Verification email sent — check your inbox.
          </p>
        )}
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

  /* Signed in, email verified, has a profile — but an admin hasn't vetted the
     account yet. Presentation only, same as every gate above: the real block
     is profile.verified in POST /api/submissions. */
  if (!profile?.verified) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
            <path d="M9 15.5l2 2 4-4" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">Your account is pending verification</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Our team reviews every new recruiter before they can refer
          candidates. Once you&apos;re verified, you&apos;ll be able to submit
          for {job.title} and any other open role.
        </p>
      </div>
    );
  }

  if (outcome?.ok) {
    const fee = feeTierMeta(job.feeTier);
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4 10-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">Candidate submitted</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Our team will screen {draft.candidateName || "your candidate"} for{" "}
          <span className="font-medium text-ink">{job.title}</span> and update
          the status in your submissions.
        </p>

        <dl className="mx-auto mt-5 max-w-sm space-y-2 rounded-xl border border-line bg-cream/40 p-4 text-left text-sm">
          <ConfirmRow label="Candidate" value={draft.candidateName || "Candidate"} />
          <ConfirmRow label="Position" value={job.title} />
          <ConfirmRow
            label="Recruiter fee"
            value={fee ? `$${fee.amount.toLocaleString()}` : "No fee tier set"}
          />
          <ConfirmRow label="Submitted" value={formatDate(submittedAt)} />
          <ConfirmRow label="Status" value={SUBMISSION_STATUS_LABEL.submitted} />
          {outcome.id && (
            <ConfirmRow label="Submission ID" value={submissionRef(outcome.id)} mono />
          )}
        </dl>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={startOver}
            className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Submit another candidate
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

      {savedCandidates.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="text-sm font-bold text-ink">Apply a saved candidate</h3>
          <p className="mt-1 text-xs text-muted">
            Already in your candidate pool? Apply them to {job.title} in one
            click — no retyping their details or re-uploading their CV.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {savedCandidates.map((c) => {
              const already =
                appliedIds.has(c.id) ||
                priorSubmissions.some(
                  (s) => s.candidateEmail.toLowerCase() === c.email.toLowerCase(),
                );
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{c.name || "Unnamed"}</p>
                    <p className="truncate text-xs text-muted">
                      {c.email}
                      {!c.cvFileId ? " · No CV saved" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applySaved(c)}
                    disabled={!c.cvFileId || applyingId === c.id || already}
                    title={!c.cvFileId ? "Add a CV to this saved candidate before applying" : undefined}
                    className="shrink-0 rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:opacity-60"
                  >
                    {already ? "Applied ✓" : applyingId === c.id ? "Applying…" : "Apply"}
                  </button>
                </li>
              );
            })}
          </ul>
          {applyError && (
            <p className="mt-3 rounded-lg bg-coral-soft px-3 py-2 text-xs text-coral">
              {applyError}
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white p-6">
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

        <Stepper current={step} />

        {step === 1 && (
          <form onSubmit={goToStep2} className="mt-5">
            <h3 className="text-lg font-bold text-ink">Candidate information</h3>
            <p className="mt-1 text-sm text-muted">
              Let us know who you&apos;re referring for {job.title}.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Candidate name">
                <input
                  className="input"
                  required
                  value={draft.candidateName}
                  onChange={(e) => updateDraft({ candidateName: e.target.value })}
                  placeholder="Jordan Lee"
                  autoFocus
                />
              </Field>
              <Field label="Candidate email">
                <input
                  className="input"
                  type="email"
                  required
                  value={draft.candidateEmail}
                  onChange={(e) => updateDraft({ candidateEmail: e.target.value })}
                  placeholder="jordan@email.com"
                />
              </Field>
              <Field label="Candidate phone" className="sm:col-span-2">
                <input
                  className="input"
                  type="tel"
                  required
                  value={draft.candidatePhone}
                  onChange={(e) => updateDraft({ candidatePhone: e.target.value })}
                  placeholder="+44 7700 900000"
                />
              </Field>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">{error}</p>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:w-auto"
            >
              Continue
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={goToStep3} className="mt-5">
            <h3 className="text-lg font-bold text-ink">Additional information</h3>
            <p className="mt-1 text-sm text-muted">
              A CV is required before this candidate can be submitted.
            </p>
            <div className="mt-5 space-y-4">
              <Field label="Why they're a fit (optional)">
                <textarea
                  className="input min-h-28 resize-y"
                  value={draft.notes}
                  onChange={(e) => updateDraft({ notes: e.target.value })}
                  placeholder="A short pitch for this candidate…"
                />
              </Field>
              <Field label="LinkedIn / portfolio URL (optional)">
                <input
                  className="input"
                  type="url"
                  value={draft.candidateLinkedin}
                  onChange={(e) => updateDraft({ candidateLinkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/jordanlee"
                />
              </Field>
              <Field label="Candidate photo (optional)">
                <input
                  className="block w-full text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateDraft({ photo: e.target.files?.[0] ?? null })}
                />
                {draft.photo && (
                  <span className="mt-1.5 block text-xs text-muted">{draft.photo.name}</span>
                )}
              </Field>
              <Field label="CV (PDF or Word, max 10 MB)">
                <input
                  className="block w-full text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
                  type="file"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => updateDraft({ cv: e.target.files?.[0] ?? null })}
                />
                {draft.cv && (
                  <span className="mt-1.5 block text-xs text-muted">
                    {draft.cv.name} · {(draft.cv.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </Field>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">{error}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setError(null); setStep(1); }}
                className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-5">
            <h3 className="text-lg font-bold text-ink">Review your application</h3>
            <p className="mt-1 text-sm text-muted">
              Is the information below correct?
            </p>

            <div className="mt-5 divide-y divide-line rounded-xl border border-line">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-ink">Candidate information</h4>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-pill bg-ink px-3 py-1 text-xs font-semibold text-white hover:opacity-85"
                  >
                    Edit
                  </button>
                </div>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <ReviewRow label="Full name" value={draft.candidateName} />
                  <ReviewRow label="Email address" value={draft.candidateEmail} />
                  <ReviewRow label="Phone number" value={draft.candidatePhone} />
                </dl>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-ink">Additional information</h4>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-pill bg-ink px-3 py-1 text-xs font-semibold text-white hover:opacity-85"
                  >
                    Edit
                  </button>
                </div>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <ReviewRow label="Why they're a fit" value={draft.notes || "No answer"} />
                  <ReviewRow label="LinkedIn / portfolio" value={draft.candidateLinkedin || "No answer"} />
                  <ReviewRow label="Photo" value={draft.photo?.name ?? "No answer"} />
                  <ReviewRow label="CV" value={draft.cv?.name ?? "No answer"} />
                </dl>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">{error}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setError(null); setStep(2); }}
                disabled={submitting}
                className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center border-b border-line pb-4">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                current > s.n
                  ? "bg-sage text-white"
                  : current === s.n
                    ? "bg-primary text-white"
                    : "border border-line text-muted"
              }`}
            >
              {current > s.n ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                s.n
              )}
            </span>
            <span className={`text-sm font-semibold ${current >= s.n ? "text-ink" : "text-muted"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span
              className={`mx-2.5 h-px w-6 sm:w-10 ${current > s.n ? "bg-sage" : "bg-line"}`}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
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
