"use client";

import { useState } from "react";
import {
  createCandidate, updateCandidate, type SavedCandidate,
} from "@/lib/candidates";

/* Add/edit a candidate in the recruiter's saved pool — the repository they
   can quick-apply from later without retyping details or re-uploading a CV.
   Same slide-over shape as AddCandidateModal, but this one never touches a
   job or a submission; it only ever writes to `candidates`. */
export function SavedCandidateModal({
  candidate,
  onClose,
}: {
  /** Present = editing; absent = adding a new candidate. */
  candidate?: SavedCandidate;
  onClose: (saved?: SavedCandidate) => void;
}) {
  const [name, setName] = useState(candidate?.name ?? "");
  const [email, setEmail] = useState(candidate?.email ?? "");
  const [phone, setPhone] = useState(candidate?.phone ?? "");
  const [linkedin, setLinkedin] = useState(candidate?.linkedin ?? "");
  const [notes, setNotes] = useState(candidate?.notes ?? "");
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = candidate
        ? await updateCandidate(candidate.id, { name, phone, linkedin, notes }, cv, photo)
        : await createCandidate({ name, email, phone, linkedin, notes }, cv, photo);
      onClose(saved);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Could not save this candidate.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={() => onClose()}
        className="flex-1 bg-ink/40 backdrop-blur-[2px]"
      />

      <aside className="flex h-full w-full max-w-lg flex-col bg-cream shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-line bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-ink">
              {candidate ? "Edit candidate" : "Save a candidate"}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {candidate
                ? "Update their details or attach a new CV."
                : "Add them to your pool — apply them to any open role later without retyping this."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-black/3 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Candidate name">
              <input
                className="input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Lee"
                autoFocus
              />
            </Field>
            <Field label="Candidate email">
              <input
                className="input"
                type="email"
                required
                disabled={Boolean(candidate)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan@email.com"
              />
              {candidate && (
                <span className="mt-1 block text-[11px] text-muted">
                  Email can&apos;t be changed once saved.
                </span>
              )}
            </Field>
            <Field label="Candidate phone" className="sm:col-span-2">
              <input
                className="input"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7700 900000"
              />
            </Field>
            <Field label="LinkedIn / portfolio URL (optional)" className="sm:col-span-2">
              <input
                className="input"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/jordanlee"
              />
            </Field>
            <Field label="Photo (optional)" className="sm:col-span-2">
              <input
                className="block w-full text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              {candidate?.photoUrl && !photo && (
                <span className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={candidate.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  Currently saved — choose a file above to replace it.
                </span>
              )}
            </Field>
            <Field label="Notes (optional)" className="sm:col-span-2">
              <textarea
                className="input min-h-24 resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Background, strengths, what roles they'd fit…"
              />
            </Field>
            <Field
              label={`CV (PDF or Word, max 4 MB)${candidate ? " — optional" : " — optional, can add later"}`}
              className="sm:col-span-2"
            >
              <input
                className="block w-full text-sm text-muted file:mr-4 file:rounded-pill file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              />
              {candidate?.cvName && !cv && (
                <span className="mt-1.5 block text-xs text-muted">
                  Currently saved: <span className="font-medium text-ink">{candidate.cvName}</span>
                  {" — choose a file above to replace it."}
                </span>
              )}
              {!candidate && (
                <span className="mt-1.5 block text-[11px] text-muted">
                  A CV is required before this candidate can be applied to a role — you can attach it now or when you edit them later.
                </span>
              )}
            </Field>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Saving…" : candidate ? "Save changes" : "Save candidate"}
          </button>
        </form>
      </aside>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
