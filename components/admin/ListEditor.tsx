"use client";

import { useState } from "react";

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
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        <input
          className="input"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setError(null); }}
          onKeyDown={(e) => {
            // Enter adds a row; without preventDefault it submits the page form.
            if (e.key === "Enter") { e.preventDefault(); add(); }
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          {addLabel}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-coral">{error}</p>}

      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 rounded-xl border border-line bg-white p-2">
            <div className="flex flex-col">
              <button
                type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="grid h-4 w-6 place-items-center text-muted hover:text-ink disabled:opacity-30"
                aria-label={`Move ${item} up`}
              >▲</button>
              <button
                type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                className="grid h-4 w-6 place-items-center text-muted hover:text-ink disabled:opacity-30"
                aria-label={`Move ${item} down`}
              >▼</button>
            </div>
            <input
              className="input flex-1"
              value={item}
              onChange={(e) => update(i, e.target.value)}
              aria-label={`Rename ${item}`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-coral hover:bg-coral-soft"
              aria-label={`Remove ${item}`}
            >
              ✕
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Nothing here yet — add one above.
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
  saving,
  message,
  onSave,
  onReset,
  children,
}: {
  title: string;
  description: string;
  saving: boolean;
  message: { type: "ok" | "err"; text: string } | null;
  onSave: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-cream/30 p-6">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-muted">{description}</p>

      {children}

      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "ok"
              ? "bg-primary-soft text-primary"
              : "bg-coral-soft text-coral"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-black/[0.02]"
          >
            Reset to defaults
          </button>
        )}
      </div>
    </section>
  );
}
