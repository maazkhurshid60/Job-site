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
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="eyebrow uppercase">Job board</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          Board filters
        </h1>
        <p className="mt-1 text-sm text-muted">
          Everything candidates and recruiters can filter by on{" "}
          <span className="font-medium text-ink">/jobs</span>. Changes go live for
          everyone as soon as you save.
        </p>
      </div>

      <div className="space-y-6">
        <SettingCard
          title="Categories"
          description="The disciplines shown in the Category filter and offered when posting a role."
          saving={savingCats}
          message={catMsg}
          onSave={() => persistCategories(categories)}
          onReset={() => { setCategories([...DEFAULT_CATEGORIES]); setCatMsg(null); }}
        >
          <ListEditor
            items={categories}
            onChange={setCategories}
            placeholder="Add a category (e.g. Electrical Engineering)"
          />
        </SettingCard>

        <SettingCard
          title="Job types"
          description="The Job type filter, and the dropdown on the posting form. Add your own — “Contract to hire” and “Per diem” are common on engineering desks."
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
          />
          {/* Renaming a type here does not rewrite jobs already saved with the
              old spelling, and those roles would drop out of the filter. */}
          <p className="mt-3 text-xs text-muted">
            Renaming a type doesn&apos;t update roles already posted under the old
            name — edit those roles too, or they won&apos;t match this filter.
          </p>
        </SettingCard>

        <SettingCard
          title="Pay filter"
          description="The top of the “Pay” slider on the board. Set it a little above your highest-paying role so the slider stays useful."
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
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted">$</span>
              <input
                className="input max-w-48"
                type="number"
                min={5000}
                step={5000}
                value={filters.salaryMax}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, salaryMax: Number(e.target.value) }))
                }
              />
            </div>
            <span className="mt-1.5 block text-xs text-muted">
              Currently showing “Any” to ${filters.salaryMax.toLocaleString()}+ in
              $5,000 steps.
            </span>
          </label>

          <div className="mt-6">
            <p className="text-sm font-medium text-ink">Locations</p>
            <p className="mt-0.5 text-xs text-muted">
              Which states appear in the Location filter. Leave every box clear to
              offer all {US_STATES.length} — that&apos;s the default.
            </p>
            <p className="mt-2 text-xs font-semibold text-primary">
              {allStates
                ? `All ${US_STATES.length} US locations`
                : `${filters.states.length} selected`}
            </p>
            <div className="mt-2 grid max-h-56 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto rounded-xl border border-line bg-white p-3 sm:grid-cols-3">
              {US_STATES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={filters.states.includes(s)}
                    onChange={() => toggleState(s)}
                  />
                  <span className="truncate">{s}</span>
                </label>
              ))}
            </div>
            {!allStates && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, states: [] }))}
                className="mt-2 text-sm font-semibold text-coral hover:opacity-80"
              >
                Clear selection (show all states)
              </button>
            )}
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
