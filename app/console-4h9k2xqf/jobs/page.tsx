"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  listJobs,
  deleteJob,
  syncTopEchelonJobs,
  type Job,
  type JobStatus,
  type TopEchelonSyncResult,
} from "@/lib/jobs";
import { getCategories, DEFAULT_CATEGORIES } from "@/lib/categories";
import { getBoardFilters, DEFAULT_FILTERS, type BoardFilters } from "@/lib/boardFilters";
import { adminRoutes } from "@/lib/routes";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { StatCard } from "@/components/dashboard/parts";
import { isWithinDays } from "@/lib/dates";

const statusStyle: Record<JobStatus, string> = {
  open: "bg-primary-soft text-primary",
  draft: "bg-line text-muted",
  closed: "bg-coral-soft text-coral",
};

const STATUS_TABS: (JobStatus | "all")[] = ["all", "open", "draft", "closed"];

/* Deterministic pastel tone per job, purely cosmetic — same idea as the
   recruiter dashboard's job avatars: stable per id, not meant as a secret,
   just gives each row a visual anchor instead of a wall of identical text. */
const AVATAR_TONES = [
  { bg: "bg-blue-brand-soft", text: "text-primary" },
  { bg: "bg-coral-soft", text: "text-coral" },
  { bg: "bg-sage-soft", text: "text-ink" },
  { bg: "bg-cream-deep", text: "text-ink" },
];

function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function jobInitials(job: Job): string {
  return (job.company || job.title).slice(0, 2).toUpperCase();
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={<div className="grid h-48 place-items-center"><Loader /></div>}>
      <JobsList />
    </Suspense>
  );
}

function JobsList() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<TopEchelonSyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // filters (search seeded from the header search's ?q=)
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  useEffect(() => { getCategories().then(setCategories); }, []);
  useEffect(() => { getBoardFilters().then(setFilters); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJobs(await listJobs());
    } catch (err) {
      setError(
        errorMessage(err, "The server didn't respond. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSync() {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const result = await syncTopEchelonJobs();
      setSyncResult(result);
      if (result.added > 0) await load();
    } catch (err) {
      setSyncError(errorMessage(err, "Could not sync Top Echelon jobs."));
    } finally {
      setSyncing(false);
    }
  }

  async function onDelete(job: Job) {
    if (!confirm(`Delete “${job.title}”? This cannot be undone.`)) return;
    setDeleting(job.id);
    try {
      await deleteJob(job.id);
      setJobs((list) => list.filter((j) => j.id !== job.id));
    } catch {
      alert("Could not delete the job.");
    } finally {
      setDeleting(null);
    }
  }

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: jobs.length, open: 0, draft: 0, closed: 0 };
    for (const j of jobs) c[j.status] = (c[j.status] ?? 0) + 1;
    return c;
  }, [jobs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (status !== "all" && j.status !== status) return false;
      if (category !== "all" && j.category !== category) return false;
      if (type !== "all" && j.employmentType !== type) return false;
      if (needle) {
        const hay = `${j.title} ${j.company} ${j.category} ${j.location}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [jobs, q, status, category, type]);

  const hasActiveFilters =
    q.trim() !== "" || status !== "all" || category !== "all" || type !== "all";

  const openBountyPool = jobs
    .filter((j) => j.status === "open")
    .reduce((sum, j) => sum + (j.bounty ?? 0), 0);
  const postedThisWeek = jobs.filter((j) => isWithinDays(j.createdAt, 7)).length;
  const categoryCount = new Set(jobs.map((j) => j.category)).size;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">Recruitment</p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">Jobs</h1>
          <p className="mt-0.5 text-xs text-muted">
            {loading
              ? "Loading…"
              : `${filtered.length} of ${jobs.length} role${jobs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="rounded-pill border border-line px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {syncing ? "Syncing…" : "Sync Top Echelon"}
          </button>
          <Link
            href={adminRoutes.newJob}
            className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            + Post a job
          </Link>
        </div>
      </div>

      {syncError && (
        <div className="mb-5 rounded-2xl border border-coral/40 bg-coral-soft px-4 py-3 text-sm text-coral">
          {syncError}
        </div>
      )}

      {syncResult && (
        <div className="mb-5 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink">
          <p>
            <span className="font-semibold">Top Echelon sync done:</span>{" "}
            {syncResult.added} added, {syncResult.skipped} already imported
            {syncResult.failed > 0 ? `, ${syncResult.failed} failed` : ""}
            {" "}(of {syncResult.found} on the portal).
            {syncResult.added > 0 && " New jobs are drafts — review them below before publishing."}
          </p>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <StatCard label="Open bounty pool" value={`$${openBountyPool.toLocaleString()}`} hint={`${statusCounts.open ?? 0} open roles`} />
          <StatCard label="Posted this week" value={postedThisWeek} />
          <StatCard label="Categories covered" value={categoryCount} />
        </div>
      )}

      {/* filters */}
      {jobs.length > 0 && (
        <div className="mb-5 space-y-3">
          {/* status tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  status === s
                    ? "border-ink bg-ink text-white"
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                {s === "all" ? "All" : s}
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
                    status === s ? "bg-white/20 text-white" : "bg-cream text-muted"
                  }`}
                >
                  {statusCounts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* search + selects */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-52 flex-1">
              <span className="sr-only">Search jobs</span>
              <input
                className="input h-10 pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, company, location…"
              />
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </label>
            <select className="input h-10 w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input h-10 w-auto" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              {filters.employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => { setQ(""); setStatus("all"); setCategory("all"); setType("all"); }}
                className="text-sm font-semibold text-coral hover:opacity-80"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {error && <LoadError what="the job list" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : jobs.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">No jobs yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Post your first role and it will appear here for the recruiter
            network to source against.
          </p>
          <Link
            href={adminRoutes.newJob}
            className="mt-5 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Post a job
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">No jobs match your filters</h2>
          <button
            type="button"
            onClick={() => { setQ(""); setStatus("all"); setCategory("all"); setType("all"); }}
            className="mt-3 text-sm font-semibold text-primary"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">Category</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Location</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Bounty</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((job) => {
                const tone = toneFor(job.id);
                return (
                  <tr key={job.id} className="group transition-colors hover:bg-cream/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${tone.bg} ${tone.text}`}
                          aria-hidden
                        >
                          {jobInitials(job)}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`${adminRoutes.jobs}/${encodeURIComponent(job.id)}`}
                            className="font-semibold text-ink group-hover:text-primary"
                          >
                            {job.title}
                          </Link>
                          <p className="truncate text-xs text-muted">
                            {job.company}
                            {job.remote ? " · Remote" : ""} · {job.employmentType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      <span className="inline-flex rounded-pill bg-cream px-2.5 py-0.5 text-xs font-medium text-ink">
                        {job.category}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 text-muted sm:table-cell">
                      {job.location || "—"}
                    </td>
                    <td className="hidden px-5 py-4 md:table-cell">
                      {job.bounty != null ? (
                        <span className="inline-flex rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                          ${job.bounty.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle[job.status]}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`${adminRoutes.jobs}/${encodeURIComponent(job.id)}`}
                          className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                        >
                          View
                        </Link>
                        <Link
                          href={adminRoutes.editJob(job.id)}
                          className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(job)}
                          disabled={deleting === job.id}
                          className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-coral hover:border-coral disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deleting === job.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
