"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listSubmissionsByRecruiter,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import { feeTierAmount } from "@/lib/feeTiers";
import { SubmissionBadge, money } from "@/components/dashboard/parts";
import { AddCandidateModal } from "@/components/dashboard/AddCandidateModal";
import { Loader } from "@/components/Loader";

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

export default function CandidatesPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<SubmissionStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user) return;
    listSubmissionsByRecruiter()
      .then(setSubs)
      .catch(() => setError("Could not load your candidates."))
      .finally(() => setLoading(false));
  }, [user]);

  /* Re-fetch when the add-candidate panel closes, in case a submission just
     landed — best-effort, swallows errors so closing the panel never throws. */
  function refreshAfterAdd() {
    setShowAdd(false);
    if (!user) return;
    listSubmissionsByRecruiter().then(setSubs).catch(() => {});
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

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            Candidates
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            {loading ? "Loading…" : `${filtered.length} of ${subs.length} submitted`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/jobs"
            className="rounded-pill border border-line px-4 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
          >
            Browse roles
          </Link>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            + Add candidate
          </button>
        </div>
      </div>

      {showAdd && <AddCandidateModal onClose={refreshAfterAdd} />}

      {error && (
        <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
          {error}
        </p>
      )}

      {!loading && subs.length > 0 && (
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

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : subs.length === 0 ? (
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
    </div>
  );
}
