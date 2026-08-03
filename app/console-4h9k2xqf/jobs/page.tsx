"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  listJobs,
  deleteJob,
  type Job,
  type JobStatus,
} from "@/lib/jobs";
import { getCategories, DEFAULT_CATEGORIES } from "@/lib/categories";
import { getBoardFilters, DEFAULT_FILTERS, type BoardFilters } from "@/lib/boardFilters";
import { adminRoutes } from "@/lib/routes";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";

const statusStyle: Record<JobStatus, string> = {
  open: "bg-primary-soft text-primary",
  draft: "bg-line text-muted",
  closed: "bg-coral-soft text-coral",
};

const STATUS_TABS: (JobStatus | "all")[] = ["all", "open", "draft", "closed"];

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Jobs</h1>
          <p className="mt-1 text-sm text-muted">
            {loading
              ? "Loading…"
              : `${filtered.length} of ${jobs.length} role${jobs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href={adminRoutes.newJob}
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Post a job
        </Link>
      </div>

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
              {filtered.map((job) => (
                <tr key={job.id} className="hover:bg-cream/40">
                  <td className="px-5 py-4">
                    <Link
                      href={`${adminRoutes.jobs}/${encodeURIComponent(job.id)}`}
                      className="font-semibold text-ink hover:text-primary"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {job.company}
                      {job.remote ? " · Remote" : ""} · {job.employmentType}
                    </p>
                  </td>
                  <td className="hidden px-5 py-4 text-muted lg:table-cell">
                    {job.category}
                  </td>
                  <td className="hidden px-5 py-4 text-muted sm:table-cell">
                    {job.location || "—"}
                  </td>
                  <td className="hidden px-5 py-4 text-muted md:table-cell">
                    {job.bounty != null ? `$${job.bounty.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle[job.status]}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`${adminRoutes.jobs}/${encodeURIComponent(job.id)}`}
                        className="text-sm font-semibold text-ink hover:text-primary"
                      >
                        View
                      </Link>
                      <Link
                        href={adminRoutes.editJob(job.id)}
                        className="text-sm font-semibold text-primary hover:text-primary-dark"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(job)}
                        disabled={deleting === job.id}
                        className="text-sm font-semibold text-coral hover:opacity-80 disabled:opacity-50"
                      >
                        {deleting === job.id ? "…" : "Delete"}
                      </button>
                    </div>
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
