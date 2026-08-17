"use client";

import { useEffect, useState } from "react";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { SubmitCandidateForm } from "./SubmitCandidateForm";
import { Loader } from "@/components/Loader";

/* Quick-add flow: pick an open role, then the same form used on a job's own
   page. Lets a recruiter submit a candidate without leaving the Candidates
   list to go browse jobs first — same idea as Indeed's "add candidate"
   shortcut from an employer's dashboard. */
export function AddCandidateModal({ onClose }: { onClose: () => void }) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch(() => setError("Could not load open roles right now."));
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
            <h2 className="text-lg font-extrabold text-ink">Add a candidate</h2>
            {selected && (
              <p className="truncate text-sm text-muted">
                For {selected.title}{selected.company ? ` · ${selected.company}` : ""}
              </p>
            )}
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
          {!selected ? (
            <>
              <p className="text-sm text-muted">Which open role is this candidate for?</p>
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
                {error && (
                  <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">{error}</p>
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
              <SubmitCandidateForm job={selected} />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
