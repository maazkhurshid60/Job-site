"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { formatPay } from "@/components/jobFormat";
import { Loader } from "@/components/Loader";

const ALL = "All";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [remoteOnly, setRemoteOnly] = useState(false);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch(() => setError("Could not load roles right now."))
      .finally(() => setLoading(false));
  }, []);

  // Build filter option lists from the data actually present.
  const categories = useMemo(
    () => [ALL, ...unique(jobs.map((j) => j.category))],
    [jobs],
  );
  const locations = useMemo(
    () => [ALL, ...unique(jobs.map((j) => j.location).filter(Boolean))],
    [jobs],
  );
  const types = useMemo(
    () => [ALL, ...unique(jobs.map((j) => j.employmentType))],
    [jobs],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (category !== ALL && j.category !== category) return false;
      if (location !== ALL && j.location !== location) return false;
      if (type !== ALL && j.employmentType !== type) return false;
      if (remoteOnly && !j.remote) return false;
      if (needle) {
        const hay = `${j.title} ${j.company} ${j.category} ${j.location} ${j.description}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [jobs, q, category, location, type, remoteOnly]);

  const activeFilters =
    (category !== ALL ? 1 : 0) +
    (location !== ALL ? 1 : 0) +
    (type !== ALL ? 1 : 0) +
    (remoteOnly ? 1 : 0) +
    (q.trim() ? 1 : 0);

  function clearFilters() {
    setQ("");
    setCategory(ALL);
    setLocation(ALL);
    setType(ALL);
    setRemoteOnly(false);
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <Container className="py-12 lg:py-16">
          <div className="max-w-2xl">
            <p className="eyebrow uppercase">Open roles</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">
              Find your next role
            </h1>
            <p className="mt-4 text-muted">
              Engineering, technical, cleared &amp; government roles hiring
              through Metro Opportunities. Log in to submit your candidates.
            </p>
          </div>

          {/* filter bar */}
          <div className="mt-8 rounded-2xl border border-line bg-white p-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <label className="relative md:col-span-2 lg:col-span-1">
                <span className="sr-only">Search roles</span>
                <input
                  className="input pl-9"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title, company…"
                />
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden
                >
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </label>

              <Select label="Category" value={category} onChange={setCategory} options={categories} />
              <Select label="Location" value={location} onChange={setLocation} options={locations} />
              <Select label="Type" value={type} onChange={setType} options={types} />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Remote only
              </label>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">
                  {loading ? "Loading…" : `${filtered.length} of ${jobs.length} roles`}
                </span>
                {activeFilters > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-primary hover:text-primary-dark"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* results table */}
          <div className="mt-6">
            {error ? (
              <p className="rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
                {error}
              </p>
            ) : loading ? (
              <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
                <Loader />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
                <h2 className="font-bold text-ink">
                  {jobs.length === 0 ? "No open roles right now" : "No roles match your filters"}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {jobs.length === 0
                    ? "Check back soon — new roles are added regularly."
                    : "Try widening your search or clearing filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-line bg-white">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Role</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Location</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 font-semibold">Compensation</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.map((job) => (
                      <tr key={job.id} className="group hover:bg-cream/40">
                        <td className="px-5 py-4">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="font-semibold text-ink group-hover:text-primary"
                          >
                            {job.title}
                          </Link>
                          <p className="text-xs text-muted">{job.company}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {job.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-muted">
                          {job.location || "—"}
                          {job.remote && (
                            <span className="ml-2 inline-flex rounded-pill bg-line px-2 py-0.5 text-[11px] font-semibold text-muted">
                              Remote
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-muted">{job.employmentType}</td>
                        <td className="px-5 py-4 text-muted">{formatPay(job)}</td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-sm font-semibold text-primary hover:text-primary-dark"
                          >
                            View &amp; apply →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "All" ? `${label}: All` : o}
          </option>
        ))}
      </select>
    </label>
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
