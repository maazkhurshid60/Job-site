"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { updateUserProfile, uploadAvatar, uploadVerificationVideo } from "@/lib/users";
import { profileCompletion } from "@/lib/profileCompletion";
import { ProfileMeter } from "@/components/dashboard/parts";
import { SOCIAL_FIELDS, SocialIcon, type SocialKind } from "@/components/SocialLinks";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    headline: "",
    location: "",
    linkedin: "",
    website: "",
    twitter: "",
    facebook: "",
    instagram: "",
    bio: "",
    photoURL: "",
  });
  const [verificationVideoId, setVerificationVideoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [videoUploading, setVideoUploading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  // The just-picked file, kept around purely so the local blob URL below can
  // preview it immediately — the video is private (like a CV), so unlike the
  // avatar there's no server URL to preview from until the next profile load.
  const [pickedVideo, setPickedVideo] = useState<File | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const pickedVideoUrl = useMemo(
    () => (pickedVideo ? URL.createObjectURL(pickedVideo) : null),
    [pickedVideo],
  );
  useEffect(() => {
    return () => { if (pickedVideoUrl) URL.revokeObjectURL(pickedVideoUrl); };
  }, [pickedVideoUrl]);

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
      website: profile.website ?? "",
      twitter: profile.twitter ?? "",
      facebook: profile.facebook ?? "",
      instagram: profile.instagram ?? "",
      bio: profile.bio ?? "",
      photoURL: profile.photoURL ?? "",
    });
    setVerificationVideoId(profile.verificationVideoId ?? null);
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

  const MAX_VIDEO_SECONDS = 30;

  /** Reads a video's duration client-side via a throwaway <video> element —
      a UX nicety (fail fast with a specific reason) rather than a real limit;
      the 4 MB size cap (lib/server/files.ts) is what actually bounds it. */
  function readVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const el = document.createElement("video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(el.duration);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read video metadata."));
      };
      el.src = url;
    });
  }

  async function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setVideoError(null);
    setVideoUploading(true);
    try {
      const duration = await readVideoDuration(file).catch(() => null);
      if (duration !== null && duration > MAX_VIDEO_SECONDS) {
        throw new Error(
          `Keep it under ${MAX_VIDEO_SECONDS} seconds — this one is ${Math.round(duration)}s.`,
        );
      }
      const id = await uploadVerificationVideo(file);
      setVerificationVideoId(id);
      setPickedVideo(file);
      setSaved(false);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Could not upload video.");
    } finally {
      setVideoUploading(false);
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  function onRemoveVideo() {
    setVerificationVideoId(null);
    setPickedVideo(null);
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { ...form, verificationVideoId });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const initial = (form.name || user?.email || "R").charAt(0).toUpperCase();

  /* Measured against the form, not the saved profile, so the bar moves as they
     type instead of only after a save. */
  const completion = profileCompletion(profile ? { ...profile, ...form } : null);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="eyebrow uppercase">Your workspace</p>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">
          My profile
        </h1>
        <p className="mt-1 text-xs text-muted">
          Add your details and a photo. Our team uses this to get to know the
          recruiters we work with.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-line bg-cream/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-bold text-ink">
            {completion.isComplete
              ? "Your profile is complete"
              : `Your profile is ${completion.percent}% complete`}
          </p>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
            {completion.filled}/{completion.total}
          </span>
        </div>
        <ProfileMeter percent={completion.percent} className="mt-2.5" />
        {completion.isComplete ? (
          <p className="mt-2.5 text-[11px] text-muted">
            Nothing left to add — remember to save if you&apos;ve just made
            changes.
          </p>
        ) : (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {completion.missing.map((f) => (
              <li
                key={f.key}
                className="rounded-pill bg-white px-2 py-1 text-[11px] font-medium text-muted ring-1 ring-line"
              >
                {f.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-line bg-white p-5"
      >
        {/* photo */}
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-xl font-bold text-primary ring-4 ring-cream">
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
              className="rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-cream/60 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : form.photoURL ? "Change photo" : "Upload photo"}
            </button>
            <p className="mt-1.5 text-[11px] text-muted">JPG, PNG, or WebP · max 5 MB</p>
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
              className="input text-xs"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jordan Lee"
            />
          </Field>
          <Field label="Email">
            <input className="input bg-cream/50 text-xs" value={profile?.email ?? ""} disabled readOnly />
          </Field>
          <Field label="Phone">
            <input
              className="input text-xs"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+44 7700 900000"
            />
          </Field>
          <Field label="Company / agency">
            <input
              className="input text-xs"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Acme Talent"
            />
          </Field>
          <Field label="Headline / role">
            <input
              className="input text-xs"
              value={form.headline}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="Technical recruiter"
            />
          </Field>
          <Field label="Location">
            <input
              className="input text-xs"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="London, UK"
            />
          </Field>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Social &amp; links
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Optional — anything you add here shows up on your recruiter profile.
          </p>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <IconField
                key={f.key}
                kind={f.key}
                label={f.label}
                value={form[f.key]}
                onChange={(v) => set(f.key, v)}
                placeholder={f.placeholder}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <Field label="About you">
            <textarea
              className="input min-h-28 resize-y text-xs"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder="A short bio — your specialisms, sectors you place in, years of experience…"
            />
          </Field>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Verification video
          </p>
          <p className="mt-1 text-[11px] text-muted">
            A short (~10 second) video of yourself introducing who you are —
            our team reviews this before verifying your account, which is
            what lets you submit candidates.
          </p>

          {(pickedVideoUrl || profile?.verificationVideoUrl) && (
            <video
              key={pickedVideoUrl ?? profile?.verificationVideoUrl}
              src={pickedVideoUrl ?? profile?.verificationVideoUrl ?? undefined}
              controls
              className="mt-3 h-40 rounded-xl bg-ink"
            />
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              disabled={videoUploading}
              className="rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-cream/60 disabled:opacity-60"
            >
              {videoUploading
                ? "Uploading…"
                : verificationVideoId
                  ? "Replace video"
                  : "Upload video"}
            </button>
            {verificationVideoId && !videoUploading && (
              <button
                type="button"
                onClick={onRemoveVideo}
                className="text-xs font-semibold text-coral hover:opacity-80"
              >
                Remove
              </button>
            )}
            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={onPickVideo}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            MP4, WebM, or MOV · max 4 MB · under {MAX_VIDEO_SECONDS} seconds
          </p>
          {videoError && (
            <p className="mt-2 rounded-lg bg-coral-soft px-3 py-2 text-xs text-coral">
              {videoError}
            </p>
          )}
          {verificationVideoId && !videoError && (
            <p className="mt-2 text-[11px] text-muted">
              Remember to save below — the video isn&apos;t attached to your
              profile until you do.
            </p>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-coral-soft px-3 py-2 text-xs text-coral">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-xs text-primary">
            Profile saved.
          </p>
        )}

        <button
          type="submit"
          disabled={saving || uploading || videoUploading}
          className="mt-5 w-full rounded-pill bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
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
      <span className="mb-1 block text-xs font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function IconField({
  kind,
  label,
  value,
  onChange,
  placeholder,
}: {
  kind: SocialKind;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <SocialIcon
          kind={kind}
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <input
          className="input pl-10 text-xs"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </Field>
  );
}
