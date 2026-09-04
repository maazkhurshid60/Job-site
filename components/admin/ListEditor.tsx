"use client";

import { useMemo, useState } from "react";
import { textAsc } from "@/lib/sorting";

/* Reorderable list of short strings — job categories and job types both need
   exactly this, and had started to diverge as one grew features the other
   didn't. Duplicates are rejected case-insensitively here for immediate
   feedback; the API normalises again on save, because a client check is a
   convenience and never the rule. */

export function ListEditor({
  items,
  onChange,
  placeholder,
  addLabel = "Add",
  noun = "item",
  nounPlural,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel?: string;
  /** Singular label used in the count line above the list, e.g. "category". */
  noun?: string;
  /** Irregular plural, e.g. "categories". Defaults to `${noun}s` when omitted. */
  nounPlural?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* This list is hand-ordered — the numbers are the order candidates see on
     /jobs — so A–Z is an action that rearranges it, not a view that hides the
     real order. The arrows keep working afterwards, and nothing is written
     until Save, so it's undoable by Reset. */
  const sorted = useMemo(() => [...items].sort(textAsc((x: string) => x)), [items]);
  const alreadySorted = useMemo(
    () => items.every((v, i) => v === sorted[i]),
    [items, sorted],
  );

  function add() {
    const value = draft.trim();
    if (!value) return;
    if (items.some((c) => c.trim().toLowerCase() === value.toLowerCase())) {
      setError("That's already on the list.");
      return;
    }
    onChange([...items, value]);
    setDraft("");
    setError(null);
  }

  function update(i: number, value: string) {
    onChange(items.map((c, idx) => (idx === i ? value : c)));
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <PlusIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60" />
          <input
            className="input"
            style={{ paddingLeft: "2.25rem" }}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              // Enter adds a row; without preventDefault it submits the page form.
              if (e.key === "Enter") { e.preventDefault(); add(); }
            }}
            placeholder={placeholder}
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {addLabel}
        </button>
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-coral">
          <AlertIcon /> {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted">
          {items.length} {items.length === 1 ? noun : nounPlural ?? `${noun}s`}
        </p>
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onChange(sorted)}
            disabled={alreadySorted}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-line disabled:text-muted/60 disabled:hover:border-line"
            title={
              alreadySorted
                ? "Already in alphabetical order"
                : "Reorder the whole list alphabetically — takes effect when you save"
            }
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5 3v14M5 17l-2.5-2.5M5 17l2.5-2.5M11 5h6M11 9h5M11 13h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {alreadySorted ? "A–Z" : "Sort A–Z"}
          </button>
        )}
      </div>

      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="group flex items-center gap-1 rounded-xl border border-line bg-white pl-1 pr-1.5 py-1.5 transition-colors hover:border-primary/25 hover:bg-primary-soft/20"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cream text-xs font-bold text-muted">
              {i + 1}
            </span>

            <input
              className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-1 text-sm text-ink outline-none focus:bg-white"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              aria-label={`Rename ${item}`}
            />

            <div className="flex shrink-0 items-center gap-0.5">
              <div className="flex flex-col overflow-hidden rounded-lg border border-line">
                <button
                  type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  className="grid h-5 w-6 place-items-center text-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent"
                  aria-label={`Move ${item} up`}
                >
                  <ChevronIcon dir="up" />
                </button>
                <button
                  type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                  className="grid h-5 w-6 place-items-center border-t border-line text-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-25 disabled:hover:bg-transparent"
                  aria-label={`Move ${item} down`}
                >
                  <ChevronIcon dir="down" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted/60 transition-colors hover:bg-coral-soft hover:text-coral"
                aria-label={`Remove ${item}`}
              >
                <XIcon />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line p-8 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-cream text-muted">
              <PlusIcon />
            </span>
            <p className="text-sm text-muted">Nothing here yet — add one above.</p>
          </li>
        )}
      </ul>
    </div>
  );
}

/** Card wrapper with a heading, description and its own save button + status. */
export function SettingCard({
  title,
  description,
  icon,
  accent = "primary",
  saving,
  message,
  onSave,
  onReset,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  accent?: "primary" | "lime" | "coral";
  saving: boolean;
  message: { type: "ok" | "err"; text: string } | null;
  onSave: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  const badge = {
    primary: "bg-primary-soft text-primary",
    lime: "bg-lime/25 text-ink",
    coral: "bg-coral-soft text-coral",
  }[accent];

  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(23,19,15,0.04)] sm:p-7">
      <div className="flex items-start gap-4">
        {icon && (
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${badge}`}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-black/[0.02]"
          >
            Reset to defaults
          </button>
        )}

        {message && (
          <p
            className={`flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-sm font-medium ${
              message.type === "ok"
                ? "bg-primary-soft text-primary"
                : "bg-coral-soft text-coral"
            }`}
          >
            {message.type === "ok" ? <CheckIcon /> : <AlertIcon />}
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---- inline icons — 20×20, stroke currentColor, matching the console's style ---- */

function ChevronIcon({ dir }: { dir: "up" | "down" }) {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d={dir === "up" ? "M5 12l5-5 5 5" : "M5 8l5 5 5-5"}
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 10l2.3 2.3L14 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5v4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="13.75" r="0.9" fill="currentColor" />
    </svg>
  );
}
