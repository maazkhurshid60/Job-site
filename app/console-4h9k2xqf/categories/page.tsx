"use client";

import { useEffect, useState } from "react";
import { getCategories, saveCategories, DEFAULT_CATEGORIES } from "@/lib/categories";
import { Loader } from "@/components/Loader";

export default function CategoriesAdminPage() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    getCategories()
      .then((list) => setItems(list))
      .finally(() => setLoading(false));
  }, []);

  function update(i: number, value: string) {
    setItems((prev) => prev.map((c, idx) => (idx === i ? value : c)));
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function add() {
    const v = newCat.trim();
    if (!v) return;
    if (items.some((c) => c.toLowerCase() === v.toLowerCase())) {
      setMsg({ type: "err", text: "That category already exists." });
      return;
    }
    setItems((prev) => [...prev, v]);
    setNewCat("");
    setMsg(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await saveCategories(items);
      setMsg({ type: "ok", text: "Categories saved. The job board and posting form now use this list." });
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Could not save. Check your admin access / Firestore rules.",
      });
    } finally {
      setSaving(false);
    }
  }

  const cleanCount = new Set(items.map((c) => c.trim().toLowerCase()).filter(Boolean)).size;

  if (loading) {
    return <div className="grid h-48 place-items-center"><Loader /></div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Job Categories</h1>
        <p className="mt-1 text-sm text-muted">
          Add, rename, reorder, or remove the categories used across the job board filter and the
          &ldquo;Post a job&rdquo; form. Changes go live for everyone as soon as you save.
        </p>
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <input
          className="input"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a category (e.g. Electrical Engineering)"
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Add
        </button>
      </div>

      {/* List */}
      <ul className="mt-5 space-y-2">
        {items.map((cat, i) => (
          <li key={i} className="flex items-center gap-2 rounded-xl border border-line bg-white p-2">
            <div className="flex flex-col">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                className="grid h-4 w-6 place-items-center text-muted hover:text-ink disabled:opacity-30" aria-label="Move up">▲</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                className="grid h-4 w-6 place-items-center text-muted hover:text-ink disabled:opacity-30" aria-label="Move down">▼</button>
            </div>
            <input
              className="input flex-1"
              value={cat}
              onChange={(e) => update(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-coral hover:bg-coral-soft"
              aria-label={`Remove ${cat}`}
            >
              ✕
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
            No categories yet — add one above.
          </li>
        )}
      </ul>

      {msg && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${msg.type === "ok" ? "bg-primary-soft text-primary" : "bg-coral-soft text-coral"}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => { setItems([...DEFAULT_CATEGORIES]); setMsg(null); }}
          className="rounded-pill border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-black/[0.02]"
        >
          Reset to defaults
        </button>
        <span className="text-xs text-muted">{cleanCount} categor{cleanCount === 1 ? "y" : "ies"}</span>
      </div>
    </div>
  );
}
