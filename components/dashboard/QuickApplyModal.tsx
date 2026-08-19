"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { quickApply, type SavedCandidate } from "@/lib/candidates";
import { Loader } from "@/components/Loader";

/* Apply a saved candidate to an open role in two clicks: pick the job, hit
   Apply. No form — the server pulls name/email/phone from the pool entry and
   clones its CV, so the same saved candidate can be quick-applied to any
   number of roles without ever retyping anything. */
export function QuickApplyModal({
  candidate,
  onClose,
}: {
  candidate: SavedCandidate;
  onClose: () => void;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);
  const [notes, setNotes] = useState("");
  const [q, setQ] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch(() => setLoadError("Could not load open roles right now."));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const needle = q.trim().toLowerCase();
  const filtered = (jobs ?? []).filter((j) => {
    if (!needle) return true;
    return `${j.title} ${j.company}`.toLowerCase().includes(needle);
  });

  async function onApply() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await quickApply(selected.id, candidate.id, notes);
      setAppliedId(id);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Could not apply this candidate.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-ink/40 backdrop-blur-[2px]"
      />

      <aside className="flex h-full w-full max-w-lg flex-col bg-cream shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-line bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink">Quick apply</h2>
            <p className="truncate text-sm text-muted">
              {candidate.name || candidate.email}
              {selected ? ` → ${selected.title}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-black/3 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {!candidate.cvFileId ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
              <h3 className="font-bold text-ink">No CV saved for this candidate</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Add a CV before applying — edit {candidate.name || "them"} from
                the candidates list to attach one.
              </p>
            </div>
          ) : appliedId ? (
            <div className="rounded-2xl border border-line bg-white p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 13l4 4 10-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">Candidate applied</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {candidate.name || "Your candidate"} was submitted for{" "}
                <span className="font-medium text-ink">{selected?.title}</span>.
                Their CV was reused automatically.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAppliedId(null);
                    setSelected(null);
                    setNotes("");
                  }}
                  className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Apply to another role
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/submissions")}
                  className="rounded-pill border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream"
                >
                  View submissions
                </button>
              </div>
            </div>
          ) : !selected ? (
            <>
              <p className="text-sm text-muted">Which open role should this candidate apply to?</p>
              <label className="relative mt-3 block">
                <span className="sr-only">Search jobs</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="input h-10 pl-10"
                  placeholder="Search jobs…"
                  autoFocus
                />
                <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </label>

              <div className="mt-3 space-y-2">
                {loadError && (
                  <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">{loadError}</p>
                )}
                {!jobs ? (
                  <div className="grid h-32 place-items-center">
                    <Loader />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">
                    {jobs.length === 0 ? "No open roles right now." : "No roles match your search."}
                  </p>
                ) : (
                  filtered.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelected(job)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left transition-colors hover:border-primary"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{job.title}</span>
                        <span className="block truncate text-xs text-muted">
                          {job.company || "Confidential"}{job.location ? ` · ${job.location}` : ""}
                        </span>
                      </span>
                      <svg className="shrink-0 text-muted" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
              >
                <span aria-hidden>←</span> Choose a different role
              </button>

              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-sm font-semibold text-ink">{candidate.name}</p>
                <p className="text-xs text-muted">{candidate.email} · {candidate.phone}</p>
                {candidate.cvName && (
                  <p className="mt-1 text-xs text-muted">CV: {candidate.cvName}</p>
                )}

                <label className="mt-4 block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">
                    Why they&apos;re a fit for {selected.title} (optional)
                  </span>
                  <textarea
                    className="input min-h-24 resize-y"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="A short pitch for this candidate…"
                  />
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={onApply}
                disabled={submitting}
                className="mt-6 w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
              >
                {submitting ? "Applying…" : `Apply for ${selected.title}`}
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
