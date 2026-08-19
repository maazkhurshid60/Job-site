"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listSubmissionsByRecruiter,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import {
  listCandidates, deleteCandidate, type SavedCandidate,
} from "@/lib/candidates";
import { feeTierAmount } from "@/lib/feeTiers";
import { SubmissionBadge, money } from "@/components/dashboard/parts";
import { AddCandidateModal } from "@/components/dashboard/AddCandidateModal";
import { SavedCandidateModal } from "@/components/dashboard/SavedCandidateModal";
import { Loader } from "@/components/Loader";
import { formatDate } from "@/lib/dates";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

type Tab = "submitted" | "saved";

export default function CandidatesPage() {
  const { user } = useAuth();
  // Saved candidates is the primary experience here — a repository recruiters
  // build up over time — with Submitted as the secondary, history view.
  const [tab, setTab] = useState<Tab>("saved");

  const [subs, setSubs] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<SubmissionStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);

  const [pool, setPool] = useState<SavedCandidate[]>([]);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [poolQ, setPoolQ] = useState("");
  const [editingCandidate, setEditingCandidate] = useState<SavedCandidate | "new" | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadSubs = useCallback(() => {
    if (!user) return;
    setSubsLoading(true);
    listSubmissionsByRecruiter()
      .then(setSubs)
      .catch(() => setSubsError("Could not load your candidates."))
      .finally(() => setSubsLoading(false));
  }, [user]);

  const loadPool = useCallback(() => {
    if (!user) return;
    setPoolLoading(true);
    listCandidates()
      .then(setPool)
      .catch(() => setPoolError("Could not load your saved candidates."))
      .finally(() => setPoolLoading(false));
  }, [user]);

  useEffect(loadSubs, [loadSubs]);
  useEffect(loadPool, [loadPool]);

  /* Re-fetch when the add-candidate panel closes, in case a submission just
     landed — best-effort, swallows errors so closing the panel never throws. */
  function refreshAfterAdd() {
    setShowAdd(false);
    loadSubs();
  }

  function onCandidateSaved(saved?: SavedCandidate) {
    setEditingCandidate(null);
    if (!saved) return;
    setPool((list) => {
      const exists = list.some((c) => c.id === saved.id);
      return exists ? list.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...list];
    });
  }

  async function onDeleteCandidate(c: SavedCandidate) {
    if (!confirm(`Remove ${c.name || c.email} from your saved candidates?`)) return;
    setRemovingId(c.id);
    try {
      await deleteCandidate(c.id);
      setPool((list) => list.filter((x) => x.id !== c.id));
    } catch (err) {
      alert(err instanceof Error && err.message ? err.message : "Could not remove this candidate.");
    } finally {
      setRemovingId(null);
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return subs.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (needle) {
        const hay = `${s.candidateName} ${s.jobTitle} ${s.company}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [subs, q, status]);

  const filteredPool = useMemo(() => {
    const needle = poolQ.trim().toLowerCase();
    if (!needle) return pool;
    return pool.filter((c) =>
      `${c.name} ${c.email} ${c.notes}`.toLowerCase().includes(needle),
    );
  }, [pool, poolQ]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            Candidates
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            {tab === "submitted"
              ? subsLoading
                ? "Loading…"
                : `${filtered.length} of ${subs.length} submitted`
              : poolLoading
                ? "Loading…"
                : `${pool.length} saved for later`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/jobs"
            className="rounded-pill border border-line px-4 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
          >
            Browse roles
          </Link>
          {tab === "submitted" ? (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              + Add candidate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditingCandidate("new")}
              className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              + Save candidate
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <TabButton active={tab === "submitted"} onClick={() => setTab("submitted")}>
          Submitted
          <Count active={tab === "submitted"}>{subs.length}</Count>
        </TabButton>
        <TabButton active={tab === "saved"} onClick={() => setTab("saved")}>
          Saved candidates
          <Count active={tab === "saved"}>{pool.length}</Count>
        </TabButton>
      </div>

      {showAdd && <AddCandidateModal onClose={refreshAfterAdd} />}
      {editingCandidate && (
        <SavedCandidateModal
          candidate={editingCandidate === "new" ? undefined : editingCandidate}
          onClose={onCandidateSaved}
        />
      )}
      {tab === "submitted" ? (
        <>
          {subsError && (
            <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
              {subsError}
            </p>
          )}

          {!subsLoading && subs.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <label className="relative w-full max-w-xs">
                <span className="sr-only">Search candidates</span>
                <input
                  className="input h-9 pl-9 text-xs"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search candidates…"
                />
                <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </label>
              <select
                className="input h-9 w-auto text-xs"
                value={status}
                onChange={(e) => setStatus(e.target.value as SubmissionStatus | "all")}
              >
                <option value="all">All statuses</option>
                {SUBMISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>{SUBMISSION_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          )}

          {subsLoading ? (
            <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
              <Loader />
            </div>
          ) : subsError ? null : subs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
              <h2 className="font-bold text-ink">No candidates yet</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Add a candidate straight from here, or browse open roles first.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  + Add candidate
                </button>
                <Link
                  href="/dashboard/jobs"
                  className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
                >
                  Browse roles
                </Link>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
              <h2 className="font-bold text-ink">No candidates match</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Try a different search or status.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-160 text-left text-xs">
                <thead className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Candidate</th>
                    <th className="px-4 py-2.5 font-semibold">Role</th>
                    <th className="px-4 py-2.5 font-semibold">Fee</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-cream/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                            {initials(s.candidateName)}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/submissions/${s.id}`}
                              className="font-semibold text-ink hover:text-primary"
                            >
                              {s.candidateName}
                            </Link>
                            <p className="truncate text-[11px] text-muted">{s.candidateEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{s.jobTitle}</p>
                        <p className="text-[11px] text-muted">{s.company}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {s.status === "hired" ? (
                          <span className="font-semibold text-primary">
                            {money(feeTierAmount(s.feeTier))}
                          </span>
                        ) : (
                          money(feeTierAmount(s.feeTier))
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SubmissionBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/submissions/${s.id}`}
                          className="whitespace-nowrap text-xs font-semibold text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {poolError && (
            <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
              {poolError}
            </p>
          )}

          {!poolLoading && pool.length > 0 && (
            <div className="mb-3">
              <label className="relative block w-full max-w-xs">
                <span className="sr-only">Search saved candidates</span>
                <input
                  className="input h-9 pl-9 text-xs"
                  value={poolQ}
                  onChange={(e) => setPoolQ(e.target.value)}
                  placeholder="Search saved candidates…"
                />
                <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </label>
            </div>
          )}

          {poolLoading ? (
            <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
              <Loader />
            </div>
          ) : poolError ? null : pool.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
              <h2 className="font-bold text-ink">Your candidate pool is empty</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Save candidates here ahead of a role. When you&apos;re browsing
                open jobs, apply anyone from this pool in two clicks — no
                retyping their details or re-uploading a CV.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setEditingCandidate("new")}
                  className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  + Save candidate
                </button>
              </div>
            </div>
          ) : filteredPool.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
              <h2 className="font-bold text-ink">No candidates match</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Try a different search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-160 text-left text-xs">
                <thead className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Candidate</th>
                    <th className="px-4 py-2.5 font-semibold">CV</th>
                    <th className="px-4 py-2.5 font-semibold">Saved</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredPool.map((c) => (
                    <tr key={c.id} className="hover:bg-cream/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                            {initials(c.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">{c.name || "Unnamed"}</p>
                            <p className="truncate text-[11px] text-muted">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.cvName ? (
                          <span className="inline-flex rounded-pill bg-sage-soft px-2 py-0.5 text-[11px] font-semibold text-ink">
                            Attached
                          </span>
                        ) : (
                          <span className="inline-flex rounded-pill bg-coral-soft px-2 py-0.5 text-[11px] font-semibold text-coral">
                            None yet
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setEditingCandidate(c)}
                            className="text-xs font-semibold text-muted hover:text-ink"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCandidate(c)}
                            disabled={removingId === c.id}
                            className="text-xs font-semibold text-muted hover:text-coral disabled:opacity-50"
                          >
                            {removingId === c.id ? "Removing…" : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Count({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
        active ? "bg-white/20 text-white" : "bg-cream text-muted"
      }`}
    >
      {children}
    </span>
  );
}
