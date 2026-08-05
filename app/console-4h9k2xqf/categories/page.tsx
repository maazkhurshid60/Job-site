"use client";

import { useEffect, useState } from "react";
import { getCategories, saveCategories, DEFAULT_CATEGORIES } from "@/lib/categories";
import {
  getBoardFilters, saveBoardFilters, DEFAULT_FILTERS, US_STATES,
  type BoardFilters,
} from "@/lib/boardFilters";
import { Loader } from "@/components/Loader";
import { errorMessage } from "@/components/admin/LoadError";
import { ListEditor, SettingCard } from "@/components/admin/ListEditor";

/* Everything the public job board filters by, in one place.
 *
 * Each card saves on its own rather than sharing one button: categories and the
 * rest live behind different endpoints, and a single save would leave the admin
 * unsure which half landed when one failed. */

type Msg = { type: "ok" | "err"; text: string } | null;

export default function BoardFiltersPage() {
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<string[]>([]);
  const [savingCats, setSavingCats] = useState(false);
  const [catMsg, setCatMsg] = useState<Msg>(null);

  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [savingTypes, setSavingTypes] = useState(false);
  const [typeMsg, setTypeMsg] = useState<Msg>(null);
  const [savingRest, setSavingRest] = useState(false);
  const [restMsg, setRestMsg] = useState<Msg>(null);

  useEffect(() => {
    Promise.all([getCategories(), getBoardFilters()])
      .then(([cats, f]) => { setCategories(cats); setFilters(f); })
      .finally(() => setLoading(false));
  }, []);

  async function persistCategories(list: string[]) {
    setSavingCats(true);
    setCatMsg(null);
    try {
      await saveCategories(list);
      setCatMsg({ type: "ok", text: "Categories saved. The board and the posting form now use this list." });
    } catch (err) {
      setCatMsg({ type: "err", text: errorMessage(err, "Could not save. Please try again.") });
    } finally {
      setSavingCats(false);
    }
  }

  /* Job types and the pay/location settings share one endpoint, so saving
     either sends the whole object — otherwise saving job types would blank the
     pay ceiling the admin set a moment earlier. */
  async function persistFilters(next: BoardFilters, which: "types" | "rest") {
    const setSaving = which === "types" ? setSavingTypes : setSavingRest;
    const setMsg = which === "types" ? setTypeMsg : setRestMsg;
    setSaving(true);
    setMsg(null);
    try {
      await saveBoardFilters(next);
      setFilters(next);
      setMsg({ type: "ok", text: "Saved. The job board is updated." });
    } catch (err) {
      setMsg({ type: "err", text: errorMessage(err, "Could not save. Please try again.") });
    } finally {
      setSaving(false);
    }
  }

  function toggleState(name: string) {
    setFilters((f) => ({
      ...f,
      states: f.states.includes(name)
        ? f.states.filter((s) => s !== name)
        : [...f.states, name],
    }));
  }

  if (loading) {
    return <div className="grid h-48 place-items-center"><Loader /></div>;
  }

  const allStates = filters.states.length === 0;

  return (
    <div className="flex gap-8">
      <div className="min-w-0 max-w-2xl flex-1">
      <div className="mb-8 flex items-start gap-4">
        <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ink text-cream">
          <FilterIcon />
        </span>
        <div>
          <p className="eyebrow uppercase">Job board</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
            Board filters
          </h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            Everything candidates and recruiters can filter by on{" "}
            <span className="font-medium text-ink">/jobs</span> — changes go live
            for everyone as soon as you save.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <SettingCard
          title="Categories"
          description="The disciplines shown in the Category filter and offered when posting a role."
          icon={<TagIcon />}
          accent="primary"
          saving={savingCats}
          message={catMsg}
          onSave={() => persistCategories(categories)}
          onReset={() => { setCategories([...DEFAULT_CATEGORIES]); setCatMsg(null); }}
        >
          <ListEditor
            items={categories}
            onChange={setCategories}
            placeholder="Add a category (e.g. Electrical Engineering)"
            noun="category"
            nounPlural="categories"
          />
        </SettingCard>

        <SettingCard
          title="Job types"
          description="The Job type filter, and the dropdown on the posting form. Add your own — “Contract to hire” and “Per diem” are common on engineering desks."
          icon={<BriefcaseIcon />}
          accent="lime"
          saving={savingTypes}
          message={typeMsg}
          onSave={() => persistFilters(filters, "types")}
          onReset={() => {
            setFilters((f) => ({ ...f, employmentTypes: [...DEFAULT_FILTERS.employmentTypes] }));
            setTypeMsg(null);
          }}
        >
          <ListEditor
            items={filters.employmentTypes}
            onChange={(employmentTypes) => setFilters((f) => ({ ...f, employmentTypes }))}
            placeholder="Add a job type (e.g. Contract to hire)"
            noun="job type"
          />
          {/* Renaming a type here does not rewrite jobs already saved with the
              old spelling, and those roles would drop out of the filter. */}
          <p className="mt-4 flex items-start gap-1.5 text-xs text-muted">
            <InfoIcon className="mt-0.5 shrink-0" />
            Renaming a type doesn&apos;t update roles already posted under the old
            name — edit those roles too, or they won&apos;t match this filter.
          </p>
        </SettingCard>

        <SettingCard
          title="Pay & locations"
          description="The “Pay” slider ceiling and which states appear in the Location filter."
          icon={<CoinIcon />}
          accent="coral"
          saving={savingRest}
          message={restMsg}
          onSave={() => persistFilters(filters, "rest")}
          onReset={() => {
            setFilters((f) => ({
              ...f,
              salaryMax: DEFAULT_FILTERS.salaryMax,
              states: [],
            }));
            setRestMsg(null);
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Maximum salary on the slider
            </span>
            <div className="flex max-w-56 items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 transition-colors focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--color-primary-soft)]">
              <span className="text-base font-semibold text-muted">$</span>
              <input
                className="w-full border-0 bg-transparent p-0 text-base font-semibold text-ink outline-none"
                type="number"
                min={5000}
                step={5000}
                value={filters.salaryMax}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, salaryMax: Number(e.target.value) }))
                }
              />
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-pill bg-cream px-3 py-1 text-xs font-medium text-muted">
              Slider shows “Any” to ${filters.salaryMax.toLocaleString()}+ in $5,000 steps
            </p>
          </label>

          <div className="mt-7">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="text-muted" />
              <p className="text-sm font-medium text-ink">Locations</p>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Which states appear in the Location filter. Leave every chip clear to
              offer all {US_STATES.length} — that&apos;s the default.
            </p>

            <div className="mt-3 flex items-center justify-between">
              <span
                className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                  allStates ? "bg-cream text-muted" : "bg-primary-soft text-primary"
                }`}
              >
                {allStates
                  ? `All ${US_STATES.length} US locations`
                  : `${filters.states.length} selected`}
              </span>
              {!allStates && (
                <button
                  type="button"
                  onClick={() => setFilters((f) => ({ ...f, states: [] }))}
                  className="text-xs font-semibold text-coral hover:opacity-80"
                >
                  Clear selection
                </button>
              )}
            </div>

            <div className="mt-3 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-line bg-cream/40 p-3">
              {US_STATES.map((s) => {
                const checked = filters.states.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleState(s)}
                    aria-pressed={checked}
                    className={`rounded-pill border px-3 py-1 text-xs font-medium transition-colors ${
                      checked
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-white text-ink hover:border-primary/40"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </SettingCard>
      </div>
      </div>

      {/* Unsaved edits show here immediately, before the admin even hits Save
          on that card — this reads live off the same state the cards edit,
          not a re-fetch, so it previews what's about to go live. */}
      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-6 rounded-2xl border border-line bg-cream/40 p-5">
          <p className="eyebrow uppercase">Live preview</p>
          <h2 className="mt-1 text-sm font-bold text-ink">How this looks on /jobs</h2>

          <PreviewSection label={`Categories (${categories.length})`}>
            {categories.slice(0, 8).map((c) => (
              <PreviewChip key={c}>{c}</PreviewChip>
            ))}
            {categories.length > 8 && (
              <PreviewChip>+{categories.length - 8} more</PreviewChip>
            )}
            {categories.length === 0 && <PreviewEmpty />}
          </PreviewSection>

          <PreviewSection label={`Job types (${filters.employmentTypes.length})`}>
            {filters.employmentTypes.map((t) => (
              <PreviewChip key={t}>{t}</PreviewChip>
            ))}
            {filters.employmentTypes.length === 0 && <PreviewEmpty />}
          </PreviewSection>

          <PreviewSection label="Pay slider">
            <PreviewChip>Any – ${filters.salaryMax.toLocaleString()}+</PreviewChip>
          </PreviewSection>

          <PreviewSection label="Locations">
            <PreviewChip>
              {allStates ? `All ${US_STATES.length} states` : `${filters.states.length} states`}
            </PreviewChip>
          </PreviewSection>

          <a
            href="/jobs"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-1.5 rounded-pill border border-line bg-white py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
          >
            Open the live board
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M7 13L13 7M8 6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </aside>
    </div>
  );
}

function PreviewSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function PreviewChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-pill border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink">
      {children}
    </span>
  );
}

function PreviewEmpty() {
  return <span className="text-xs text-muted">Nothing set — falls back to defaults.</span>;
}

/* ---- inline icons — 20×20, stroke currentColor, matching the console's style ---- */

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 4h6.2a1 1 0 01.7.3l6 6a1 1 0 010 1.4l-5.2 5.2a1 1 0 01-1.4 0l-6-6A1 1 0 014 10.2V4z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
      <circle cx="7.5" cy="7.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="6.5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 6.5V5a2 2 0 012-2h2a2 2 0 012 2v1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10.5h14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5v7M8 8.2c0-.9.9-1.6 2-1.6s2 .6 2 1.4-.9 1.2-2 1.4-2 .6-2 1.4.9 1.4 2 1.4 2-.7 2-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 18s6-5.1 6-9.6A6 6 0 004 8.4C4 12.9 10 18 10 18z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="10" cy="8.3" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="6.8" r="0.9" fill="currentColor" />
      <path d="M10 9.5v4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
