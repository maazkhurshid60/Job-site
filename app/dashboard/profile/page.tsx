"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { updateUserProfile, uploadAvatar } from "@/lib/users";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    headline: "",
    location: "",
    linkedin: "",
    bio: "",
    photoURL: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Hydrate the form from the loaded profile.
  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      phone: profile.phone ?? "",
      company: profile.company ?? "",
      headline: profile.headline ?? "",
      location: profile.location ?? "",
      linkedin: profile.linkedin ?? "",
      bio: profile.bio ?? "",
      photoURL: profile.photoURL ?? "",
    });
  }, [profile]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      set("photoURL", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await updateUserProfile(user.uid, form);
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const initial = (form.name || user?.email || "R").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="eyebrow uppercase">Your workspace</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          My profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Add your details and a photo. Our team uses this to get to know the
          recruiters we work with.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-line bg-white p-6"
      >
        {/* photo */}
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-2xl font-bold text-primary">
            {form.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.photoURL}
                alt="Your profile photo"
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-cream/60 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : form.photoURL ? "Change photo" : "Upload photo"}
            </button>
            <p className="mt-1.5 text-xs text-muted">JPG, PNG, or WebP · max 5 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPickPhoto}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jordan Lee"
            />
          </Field>
          <Field label="Email">
            <input className="input bg-cream/50" value={profile?.email ?? ""} disabled readOnly />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+44 7700 900000"
            />
          </Field>
          <Field label="Company / agency">
            <input
              className="input"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Acme Talent"
            />
          </Field>
          <Field label="Headline / role">
            <input
              className="input"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="Technical recruiter"
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="London, UK"
            />
          </Field>
          <Field label="LinkedIn URL" className="sm:col-span-2">
            <input
              className="input"
              value={form.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </Field>
          <Field label="About you" className="sm:col-span-2">
            <textarea
              className="input min-h-28 resize-y"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="A short bio — your specialisms, sectors you place in, years of experience…"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="mt-4 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
            Profile saved.
          </p>
        )}

        <button
          type="submit"
          disabled={saving || uploading}
          className="mt-6 w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
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
