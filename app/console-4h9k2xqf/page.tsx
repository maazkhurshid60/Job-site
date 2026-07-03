"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listJobs, deleteJob, type Job, type JobStatus } from "@/lib/jobs";
import { adminRoutes } from "@/lib/routes";
import { Loader } from "@/components/Loader";

const statusStyle: Record<JobStatus, string> = {
  open: "bg-primary-soft text-primary",
  draft: "bg-line text-muted",
  closed: "bg-coral-soft text-coral",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJobs(await listJobs());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load jobs. Check your Firestore rules.",
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? "Loading…" : `${jobs.length} role${jobs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href={adminRoutes.newJob}
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Post a job
        </Link>
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
          {error}
        </p>
      )}

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
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Location</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Bounty</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-cream/40">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{job.title}</p>
                    <p className="text-xs text-muted">
                      {job.company}
                      {job.remote ? " · Remote" : ""} · {job.employmentType}
                    </p>
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
