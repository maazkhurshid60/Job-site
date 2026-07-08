"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/lib/auth";
import {
  listOpenJobs,
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  type Job,
} from "@/lib/jobs";
import { formatPay } from "@/components/jobFormat";
import type { Timestamp } from "firebase/firestore";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont",
  "Virginia","Washington","West Virginia","Wisconsin","Wyoming","Washington, D.C.",
];
const SALARY_MAX = 200000;

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [stateFilter, setStateFilter] = useState("All");
  const [remote, setRemote] = useState(false);
  const [onsite, setOnsite] = useState(false);
  const [minSalary, setMinSalary] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"board" | "list">("board");
  const [onlySaved, setOnlySaved] = useState(false);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch(() => setError("Could not load roles right now."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const st = stateFilter !== "All" ? stateFilter.toLowerCase() : null;
    return jobs.filter((j) => {
      if (onlySaved && !saved.has(j.id)) return false;
      if (remote && !onsite && !j.remote) return false;
      if (onsite && !remote && j.remote) return false;
      if (st && !j.location.toLowerCase().includes(st)) return false;
      if (types.size && !types.has(j.employmentType)) return false;
      if (cats.size && !cats.has(j.category)) return false;
      if (minSalary > 0 && (j.salaryMax ?? j.salaryMin ?? 0) < minSalary) return false;
      if (needle) {
        const hay = `${j.title} ${j.company} ${j.category} ${j.location} ${j.description}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [jobs, q, cats, types, stateFilter, remote, onsite, minSalary, onlySaved, saved]);

  const activeCount =
    cats.size + types.size + (stateFilter !== "All" ? 1 : 0) +
    (remote ? 1 : 0) + (onsite ? 1 : 0) + (minSalary > 0 ? 1 : 0);

  function toggleIn(set: Set<string>, key: string, apply: (s: Set<string>) => void) {
    const n = new Set(set);
    n.has(key) ? n.delete(key) : n.add(key);
    apply(n);
  }
  function clearAll() {
    setQ(""); setCats(new Set()); setTypes(new Set());
    setStateFilter("All"); setRemote(false); setOnsite(false); setMinSalary(0);
  }

  // honest sidebar data
  const topCategories = useMemo(() => countTop(jobs.map((j) => j.category), 6), [jobs]);
  const topLocations = useMemo(
    () => countTop(jobs.map((j) => j.location).filter(Boolean), 5),
    [jobs],
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <Container className="py-8 lg:py-10">
          {/* title + search */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">Explore jobs</h1>
            <label className="relative w-full max-w-xs">
              <span className="sr-only">Search</span>
              <input
                className="input h-11 pl-10"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
              />
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </label>
          </div>

          {/* filter chips row */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Dropdown label="Category" count={cats.size}>
              <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {JOB_CATEGORIES.map((c) => (
                  <Check key={c} label={c} checked={cats.has(c)} onChange={() => toggleIn(cats, c, setCats)} />
                ))}
              </div>
            </Dropdown>

            <Dropdown label="Job type" count={types.size}>
              <div className="space-y-1.5">
                {EMPLOYMENT_TYPES.map((t) => (
                  <Check key={t} label={t} checked={types.has(t)} onChange={() => toggleIn(types, t, setTypes)} />
                ))}
              </div>
            </Dropdown>

            <Dropdown label="Location" count={(stateFilter !== "All" ? 1 : 0) + (remote ? 1 : 0) + (onsite ? 1 : 0)}>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <Check label="Remote" checked={remote} onChange={() => setRemote((v) => !v)} />
                  <Check label="Onsite" checked={onsite} onChange={() => setOnsite((v) => !v)} />
                </div>
                <select className="input" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                  <option value="All">All US locations</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </Dropdown>

            <Dropdown label="Pay" count={minSalary > 0 ? 1 : 0}>
              <div>
                <p className="text-center text-sm font-semibold text-ink">
                  {minSalary === 0 ? "Any salary" : `$${minSalary.toLocaleString()}+`}
                </p>
                <input type="range" min={0} max={SALARY_MAX} step={5000} value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value))}
                  className="mt-2 w-full accent-primary" />
                <div className="mt-1 flex justify-between text-[11px] text-muted">
                  <span>Any</span><span>${SALARY_MAX.toLocaleString()}+</span>
                </div>
              </div>
            </Dropdown>

            {activeCount > 0 && (
              <button onClick={clearAll} className="rounded-full px-3 py-1.5 text-sm font-semibold text-coral hover:opacity-80">
                Clear all
              </button>
            )}
          </div>

          {/* results header + view toggle */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">
              {loading ? "…" : filtered.length} job{filtered.length === 1 ? "" : "s"} found
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-line p-1">
                <ViewBtn active={view === "list"} onClick={() => setView("list")} label="List" />
                <ViewBtn active={view === "board"} onClick={() => setView("board")} label="Board" />
              </div>
              <button
                onClick={() => setOnlySaved((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${
                  onlySaved ? "border-primary bg-primary-soft text-primary" : "border-line text-ink hover:bg-black/[0.03]"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill={onlySaved ? "currentColor" : "none"} aria-hidden>
                  <path d="M5 3h10v14l-5-3.5L5 17V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                Saved ({saved.size})
              </button>
            </div>
          </div>

          {/* body: listing + honest sidebar */}
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              {error ? (
                <p className="rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>
              ) : loading ? (
                <div className="grid h-64 place-items-center rounded-2xl border border-line"><Loader /></div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line p-12 text-center">
                  <h3 className="font-bold text-ink">
                    {onlySaved ? "No saved jobs yet" : jobs.length === 0 ? "No open roles right now" : "No roles match your filters"}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {onlySaved ? "Bookmark roles to see them here." : "Try clearing some filters."}
                  </p>
                </div>
              ) : (
                <div className={view === "board" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
                  {filtered.map((job) => (
                    <JobCard key={job.id} job={job} saved={saved.has(job.id)} onSave={() => toggleIn(saved, job.id, setSaved)} />
                  ))}
                </div>
              )}
            </div>

            {/* sidebar — honest, no fake metrics */}
            <aside className="space-y-4">
              <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm text-primary">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M10 2l2.4 5 5.6.5-4.2 3.7 1.3 5.6L10 14l-5.1 2.8L6.2 11 2 7.3l5.6-.5L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
                <span><strong>{jobs.length}</strong> open role{jobs.length === 1 ? "" : "s"} from Metro Associates</span>
              </div>

              <SidebarCard title="Browse by category">
                <div className="flex flex-wrap gap-2">
                  {topCategories.map(([c, n]) => (
                    <button key={c} onClick={() => toggleIn(cats, c, setCats)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        cats.has(c) ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:text-ink"
                      }`}>
                      {c} <span className="text-muted">· {n}</span>
                    </button>
                  ))}
                  {topCategories.length === 0 && <p className="text-sm text-muted">No roles yet.</p>}
                </div>
              </SidebarCard>

              <SidebarCard title="Popular locations">
                <ul className="space-y-2 text-sm">
                  {topLocations.map(([loc, n]) => (
                    <li key={loc}>
                      <button onClick={() => setQ(loc)} className="flex w-full items-center justify-between text-left text-ink hover:text-primary">
                        <span>{loc}</span>
                        <span className="text-xs text-muted">{n}</span>
                      </button>
                    </li>
                  ))}
                  {topLocations.length === 0 && <li className="text-muted">No locations yet.</li>}
                </ul>
              </SidebarCard>

              <div className="rounded-2xl bg-ink p-6 text-white">
                <h3 className="font-bold">{user ? "Ready to submit?" : "Want to apply?"}</h3>
                <p className="mt-1 text-sm text-white/70">
                  {user
                    ? "Open a role and put your best candidate forward."
                    : "Log in to submit your candidates to any open role."}
                </p>
                <Link href={user ? "/dashboard" : "/login"}
                  className="mt-4 inline-block rounded-full bg-lime px-5 py-2.5 text-sm font-semibold text-ink hover:bg-lime/90">
                  {user ? "Go to dashboard" : "Log in"}
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

/* ---- job card ---- */
function JobCard({ job, saved, onSave }: { job: Job; saved: boolean; onSave: () => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-5 transition-shadow hover:shadow-[0_20px_50px_-30px_rgba(23,19,15,0.35)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          <span>{job.company}</span>
          <span title="Metro-vetted role" className="grid h-4 w-4 place-items-center rounded-full bg-primary text-white">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <button type="button" onClick={onSave} aria-label={saved ? "Remove bookmark" : "Save job"}
          className={saved ? "text-primary" : "text-muted hover:text-ink"}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill={saved ? "currentColor" : "none"} aria-hidden>
            <path d="M5 3h10v14l-5-3.5L5 17V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <Link href={`/jobs/${job.id}`} className="mt-2 text-lg font-bold text-ink hover:text-primary">
        {job.title}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <Meta icon="M4 7h12v9H4zM7 7V5h6v2" text={job.employmentType} />
        <Meta icon="M10 2a5 5 0 015 5c0 3.5-5 9-5 9S5 10.5 5 7a5 5 0 015-5zM10 9a2 2 0 100-4 2 2 0 000 4z" text={job.remote ? "Remote" : job.location || "Onsite"} />
        <Meta icon="M10 2a8 8 0 100 16 8 8 0 000-16zM10 6v4l3 2" text={`Posted ${timeAgo(job.createdAt)}`} />
      </div>

      {job.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{job.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Tag>{job.category}</Tag>
        {job.remote && <Tag>Remote</Tag>}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <p className="text-base font-extrabold text-ink">{formatPay(job)}</p>
        <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-primary hover:text-primary-dark">
          View &amp; apply →
        </Link>
      </div>
    </div>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d={icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {text}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-lg bg-cream px-2.5 py-1 text-xs font-medium text-muted">{children}</span>;
}

/* ---- filter dropdown chip ---- */
function Dropdown({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
          count > 0 ? "border-primary bg-primary-soft text-primary" : "border-line text-ink hover:bg-black/[0.03]"
        }`}
      >
        {label}
        {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">{count}</span>}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={open ? "rotate-180" : ""}>
          <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-64 rounded-xl border border-line bg-white p-4 shadow-[0_20px_50px_-20px_rgba(23,19,15,0.3)]">
          {children}
        </div>
      )}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-primary" />
      {label}
    </label>
  );
}

function ViewBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${active ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
      {label}
    </button>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
      {children}
    </div>
  );
}

/* ---- helpers ---- */
function countTop(values: string[], n: number): [string, number][] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function timeAgo(ts: Timestamp | null): string {
  const d = ts?.toDate?.();
  if (!d) return "recently";
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
}
