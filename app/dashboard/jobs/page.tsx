"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { getCategories, DEFAULT_CATEGORIES } from "@/lib/categories";
import { getBoardFilters, DEFAULT_FILTERS, type BoardFilters } from "@/lib/boardFilters";
import { formatPay } from "@/components/jobFormat";
import { timeAgo } from "@/lib/dates";
import { FEE_TIERS, feeTierMeta } from "@/lib/feeTiers";
import { useSavedJobs } from "@/lib/savedJobs";
import { Loader } from "@/components/Loader";

type SortMode = "newest" | "fee";
const PAGE_SIZE = 12;

/* The in-dashboard jobs browser. Deliberately separate from app/jobs/page.tsx
   (the public marketing board with its Navbar/Footer/hero banner) — a
   signed-in recruiter clicking "Browse jobs" from the sidebar should stay
   inside the dashboard shell, not get bounced out to the public site. */
export default function DashboardJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");

  // Re-syncs when the URL's own q param changes — e.g. the header search bar
  // pushing a new ?q= while already on this page, which a mount-only
  // initializer would silently miss since the route doesn't remount. Deferred
  // via the timer (rather than calling setQ directly in the effect body) so
  // this doesn't trigger a synchronous-setState-in-effect render cascade.
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    const timer = setTimeout(() => setQ(urlQ), 0);
    return () => clearTimeout(timer);
  }, [searchParams]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [onlySaved, setOnlySaved] = useState(false);
  const [sort, setSort] = useState<SortMode>("newest");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { saved, toggle: toggleSaved } = useSavedJobs();

  const [types, setTypes] = useState<Set<string>>(new Set());
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [feeTiers, setFeeTiers] = useState<Set<string>>(new Set());
  const [minSalary, setMinSalary] = useState(0);
  const [maxSalary, setMaxSalary] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch(() => setError("Could not load open roles right now."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { getCategories().then(setCategories); }, []);
  useEffect(() => {
    getBoardFilters().then(setBoardFilters);
  }, []);

  function toggleIn(set: Set<string>, key: string, apply: (s: Set<string>) => void) {
    const n = new Set(set);
    if (n.has(key)) n.delete(key);
    else n.add(key);
    apply(n);
  }

  function resetFilters() {
    setQ("");
    setTypes(new Set());
    setCats(new Set());
    setFeeTiers(new Set());
    setMinSalary(0);
    setMaxSalary(0);
  }

  const typeCounts = useMemo(() => countBy(jobs, (j) => j.employmentType), [jobs]);
  const catCounts = useMemo(() => countBy(jobs, (j) => j.category), [jobs]);
  const feeCounts = useMemo(
    () => countBy(jobs.filter((j) => j.feeTier), (j) => j.feeTier as string),
    [jobs],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = jobs.filter((j) => {
      if (dismissed.has(j.id)) return false;
      if (onlySaved && !saved.has(j.id)) return false;
      if (types.size && !types.has(j.employmentType)) return false;
      if (cats.size && !cats.has(j.category)) return false;
      if (feeTiers.size && !(j.feeTier && feeTiers.has(j.feeTier))) return false;
      const pay = j.salaryMax ?? j.salaryMin ?? 0;
      if (minSalary > 0 && pay < minSalary) return false;
      if (maxSalary > 0 && pay > maxSalary) return false;
      if (needle) {
        const hay = `${j.title} ${j.company} ${j.category} ${j.location}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "fee") {
        return (feeTierMeta(b.feeTier)?.amount ?? 0) - (feeTierMeta(a.feeTier)?.amount ?? 0);
      }
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  }, [jobs, q, types, cats, feeTiers, minSalary, maxSalary, onlySaved, saved, dismissed, sort]);

  // Any change to what's being filtered/sorted invalidates the current page —
  // otherwise "page 3" could silently show nothing after narrowing results.
  // Adjusted during render (React's documented pattern for this), not an
  // effect: an effect would render page 3 of the new results for one frame
  // before snapping back to page 1.
  const filterKey = JSON.stringify([
    q, [...types], [...cats], [...feeTiers], minSalary, maxSalary, onlySaved, sort,
  ]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCount = types.size + cats.size + feeTiers.size + (minSalary > 0 ? 1 : 0)
    + (maxSalary > 0 && maxSalary < boardFilters.salaryMax ? 1 : 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Browse jobs</h1>
          <p className="mt-0.5 text-xs text-muted">
            {loading ? "Loading…" : `${filtered.length} of ${jobs.length} open role${jobs.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOnlySaved((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-semibold ${
            onlySaved ? "border-primary bg-primary-soft text-primary" : "border-line text-ink hover:bg-black/3"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill={onlySaved ? "currentColor" : "none"} aria-hidden>
            <path d="M5 3h10v14l-5-3.5L5 17V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          Saved ({saved.size})
        </button>
      </div>

      {/* search bar */}
      <label className="relative block">
        <span className="sr-only">Search jobs</span>
        <input
          className="input h-10 rounded-pill pl-10 text-xs"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, company or location…"
        />
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </label>

      <div className="mt-4 grid gap-4 lg:grid-cols-[230px_1fr]">
        {/* filters sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <FilterSection title="Type of Employment">
            {boardFilters.employmentTypes.map((t) => (
              <FilterCheck
                key={t}
                label={t}
                count={typeCounts.get(t) ?? 0}
                checked={types.has(t)}
                onChange={() => toggleIn(types, t, setTypes)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Category">
            {categories.map((c) => (
              <FilterCheck
                key={c}
                label={c}
                count={catCounts.get(c) ?? 0}
                checked={cats.has(c)}
                onChange={() => toggleIn(cats, c, setCats)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Recruiter Fee">
            {FEE_TIERS.map((t) => (
              <FilterCheck
                key={t.value}
                label={`$${t.amount.toLocaleString()} — ${t.label}`}
                count={feeCounts.get(t.value) ?? 0}
                checked={feeTiers.has(t.value)}
                onChange={() => toggleIn(feeTiers, t.value, setFeeTiers)}
              />
            ))}
          </FilterSection>

          <FilterSection title="Salary Range">
            <input
              type="range"
              min={0}
              max={boardFilters.salaryMax}
              step={5000}
              value={maxSalary || boardFilters.salaryMax}
              onChange={(e) => setMaxSalary(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="mt-2 flex items-center gap-1.5">
              <label className="min-w-0 flex-1">
                <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">Min</span>
                <input
                  type="number"
                  min={0}
                  className="input h-8 text-xs"
                  value={minSalary || ""}
                  onChange={(e) => setMinSalary(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </label>
              <span className="mt-3.5 text-muted">–</span>
              <label className="min-w-0 flex-1">
                <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">Max</span>
                <input
                  type="number"
                  min={0}
                  className="input h-8 text-xs"
                  value={maxSalary || ""}
                  onChange={(e) => setMaxSalary(Number(e.target.value) || 0)}
                  placeholder={boardFilters.salaryMax.toLocaleString()}
                />
              </label>
            </div>
          </FilterSection>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-pill border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
            >
              Reset filters
            </button>
          )}
        </aside>

        {/* results */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-bold text-ink">
              {loading ? "…" : filtered.length} job{filtered.length === 1 ? "" : "s"} found
            </h2>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Sort by
              <select
                className="input h-8 w-auto text-xs"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
              >
                <option value="newest">Newest post</option>
                <option value="fee">Highest fee</option>
              </select>
            </label>
          </div>

          {error ? (
            <p className="rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>
          ) : loading ? (
            <div className="grid h-64 place-items-center rounded-2xl border border-line bg-white">
              <Loader />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
              <h3 className="font-bold text-ink">
                {onlySaved ? "No saved jobs yet" : jobs.length === 0 ? "No open roles right now" : "No roles match your filters"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {onlySaved ? "Bookmark a role to see it here." : "Try clearing some filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {paginated.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    saved={saved.has(job.id)}
                    onSave={() => toggleSaved(job.id)}
                    onDismiss={() => setDismissed((d) => new Set(d).add(job.id))}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-muted">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Deterministic bright tone per job — same reasoning as submissionRef in
   lib/submissions.ts: stable per id, purely cosmetic, not a secret. */
const ICON_TONES = [
  "bg-blue-brand text-white",
  "bg-coral text-white",
  "bg-ink text-white",
  "bg-lime text-blue-brand-dark",
  "bg-sage text-blue-brand-dark",
  "bg-amber-500 text-white",
];

function toneFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ICON_TONES[hash % ICON_TONES.length];
}

function JobCard({
  job, saved, onSave, onDismiss,
}: {
  job: Job;
  saved: boolean;
  onSave: () => void;
  onDismiss: () => void;
}) {
  const tier = feeTierMeta(job.feeTier);
  return (
    <div className="group flex flex-col rounded-2xl border border-line bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_50px_-30px_rgba(23,19,15,0.35)]">
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${toneFor(job.id)}`}
        >
          {initials(job.company || job.title)}
        </span>
        <button
          type="button"
          onClick={onSave}
          aria-label={saved ? "Remove bookmark" : "Save job"}
          className={`shrink-0 transition-colors ${saved ? "text-primary" : "text-muted hover:text-ink"}`}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill={saved ? "currentColor" : "none"} aria-hidden>
            <path d="M5 3h10v14l-5-3.5L5 17V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <Link href={`/dashboard/jobs/${job.id}`} className="mt-2 text-sm font-bold leading-snug text-ink group-hover:text-primary">
        {job.title}
      </Link>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {job.company || "Confidential"}
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
        <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M10 2a5 5 0 015 5c0 3.5-5 9-5 9S5 10.5 5 7a5 5 0 015-5zM10 9a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {job.remote ? "Remote" : job.location || "Onsite"}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-2 text-[11px] font-medium text-muted">
        <span>{job.employmentType}</span>
        <span aria-hidden>·</span>
        <span>{job.remote ? "Remote" : "On-site"}</span>
        <span aria-hidden>·</span>
        <span className="font-semibold text-ink">{formatPay(job)}</span>
      </div>

      {job.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{job.description}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        <Tag>{job.category}</Tag>
        {tier && <Tag tone="primary">${tier.amount.toLocaleString()} fee</Tag>}
        {job.remote && <Tag>Remote</Tag>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <p className="text-[11px] text-muted">Posted {timeAgo(job.createdAt)}</p>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Not interested — hide this role"
            title="Not interested"
            className="text-muted transition-colors hover:text-coral"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onSave}
            aria-label={saved ? "Remove bookmark" : "Save job"}
            className={`transition-colors ${saved ? "text-primary" : "text-muted hover:text-primary"}`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill={saved ? "currentColor" : "none"} aria-hidden>
              <path d="M10 17.5s-6.5-4-6.5-8.5a3.5 3.5 0 016.5-2 3.5 3.5 0 016.5 2c0 4.5-6.5 8.5-6.5 8.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function Tag({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "primary" }) {
  return (
    <span
      className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-medium ${
        tone === "primary" ? "bg-primary-soft text-primary" : "bg-cream text-muted"
      }`}
    >
      {children}
    </span>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-bold text-ink"
      >
        {title}
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden className={open ? "" : "rotate-180"}>
          <path d="M2.5 7.5L6 4l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="mt-2.5 space-y-1.5">{children}</div>}
    </div>
  );
}

function FilterCheck({
  label, count, checked, onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-ink">
      <span className="flex min-w-0 items-center gap-1.5">
        <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5 shrink-0 accent-primary" />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-[11px] text-muted">{count}</span>
    </label>
  );
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
}

function countBy(jobs: Job[], key: (j: Job) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const j of jobs) {
    const k = key(j);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}
