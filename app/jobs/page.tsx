"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { Loader } from "@/components/Loader";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { getCategories, DEFAULT_CATEGORIES } from "@/lib/categories";
import {
  getBoardFilters, statesFor, DEFAULT_FILTERS, type BoardFilters,
} from "@/lib/boardFilters";
import { formatPay } from "@/components/jobFormat";
import { photo } from "@/components/images";
import { timeAgo } from "@/lib/dates";

/* The state list and the pay ceiling used to be hardcoded here. They now come
   from lib/boardFilters (defaults) and the console (overrides), so the board
   and the admin screen can't disagree about them. */

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Seed the search box from ?q= so links into a pre-filtered board work — this
     is the URL the sitelinks SearchAction in lib/seo.ts points at. Read during
     the initial render rather than in an effect, which would cause a second
     render pass. The Suspense boundary this needs lives in ./layout.tsx. */
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
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

  useEffect(() => { getCategories().then(setCategories); }, []);
  /* Job types, the pay ceiling and the location list are all set in the
     console. Both helpers swallow their own errors and return defaults, so a
     failed read leaves a working filter bar rather than empty dropdowns. */
  useEffect(() => { getBoardFilters().then(setFilters); }, []);

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
        {/* Board banner. The count comes from the loaded jobs, so it can't
            disagree with the list underneath it. */}
        <Container className="pt-6">
          <div className="relative overflow-hidden rounded-3xl">
            <div className="relative aspect-[16/7] w-full sm:aspect-[21/6]">
              <Image
                src={photo.highwayInterchange.src}
                alt={photo.highwayInterchange.alt}
                fill
                priority
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/60 to-ink/10" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 py-6 sm:px-10">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                Open roles
              </span>
              <h1 className="mt-1.5 max-w-xl text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                Engineering &amp; DOT jobs
              </h1>
              <p className="mt-2 hidden max-w-md text-sm text-white/80 sm:block">
                Civil, structural, transportation and technical roles — each one
                showing its referral commission before you apply or refer.
              </p>
            </div>
          </div>
        </Container>

        <Container className="py-8 lg:py-10">
          {/* search */}
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                {categories.map((c) => (
                  <Check key={c} label={c} checked={cats.has(c)} onChange={() => toggleIn(cats, c, setCats)} />
                ))}
              </div>
            </Dropdown>

            <Dropdown label="Job type" count={types.size}>
              <div className="space-y-1.5">
                {filters.employmentTypes.map((t) => (
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
                  {statesFor(filters).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </Dropdown>

            <Dropdown label="Pay" count={minSalary > 0 ? 1 : 0}>
              <div>
                <p className="text-center text-sm font-semibold text-ink">
                  {minSalary === 0 ? "Any salary" : `$${minSalary.toLocaleString()}+`}
                </p>
                <input type="range" min={0} max={filters.salaryMax} step={5000} value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value))}
                  className="mt-2 w-full accent-primary" />
                <div className="mt-1 flex justify-between text-[11px] text-muted">
                  <span>Any</span><span>${filters.salaryMax.toLocaleString()}+</span>
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
                <span><strong>{jobs.length}</strong> open role{jobs.length === 1 ? "" : "s"} from JobFolder</span>
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
    <div className="group flex flex-col rounded-2xl border border-line bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_50px_-30px_rgba(23,19,15,0.35)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary"
          >
            {initials(job.company)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-ink">{job.company}</span>
              <span title="JobFolder-vetted role" className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-primary text-white">
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <p className="text-xs text-muted">Posted {timeAgo(job.createdAt)}</p>
          </div>
        </div>
        <button type="button" onClick={onSave} aria-label={saved ? "Remove bookmark" : "Save job"}
          className={`shrink-0 transition-colors ${saved ? "text-primary" : "text-muted hover:text-ink"}`}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill={saved ? "currentColor" : "none"} aria-hidden>
            <path d="M5 3h10v14l-5-3.5L5 17V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <Link href={`/jobs/${job.id}`} className="mt-3 text-lg font-bold leading-snug text-ink group-hover:text-primary">
        {job.title}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <Meta icon="M4 7h12v9H4zM7 7V5h6v2" text={job.employmentType} />
        <Meta icon="M10 2a5 5 0 015 5c0 3.5-5 9-5 9S5 10.5 5 7a5 5 0 015-5zM10 9a2 2 0 100-4 2 2 0 000 4z" text={job.remote ? "Remote" : job.location || "Onsite"} />
      </div>

      {job.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{job.description}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Tag>{job.category}</Tag>
        {job.remote && <Tag>Remote</Tag>}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-extrabold text-ink">{formatPay(job)}</p>
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1 rounded-pill bg-cream px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors group-hover:bg-primary group-hover:text-white"
          >
            View &amp; apply
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        {job.bounty != null && job.bounty > 0 && (
          <div className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-sage-soft px-3 py-1 text-xs font-bold text-ink">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M10 2v16M14.5 5.5H8.25a2.25 2.25 0 000 4.5h3.5a2.25 2.25 0 010 4.5H5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Earn ${job.bounty.toLocaleString()} referral commission
          </div>
        )}
      </div>
    </div>
  );
}

/** Up to two initials from a company name, for the card avatar. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
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

