"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getMySite, saveMySite, type RecruiterSite } from "@/lib/recruiterSite";
import {
  SITE_TEMPLATES, SITE_THEMES, slugProblem, type SiteTemplate, type SiteThemeId,
} from "@/lib/siteThemes";
import { RecruiterSiteView } from "@/components/site/RecruiterSiteView";

/* Step-by-step builder for the free recruiter website perk (see
   /dashboard/career-site). Unlike SubmitCandidateForm's linear one-shot
   steps, this is an editable asset the recruiter comes back to — so the
   steps are tabs they can jump between freely, and "Save draft" / "Publish"
   both work from any step, rather than gating progress behind validation. */

type Draft = {
  slug: string;
  template: SiteTemplate;
  theme: SiteThemeId;
  tagline: string;
  intro: string;
  specialisms: string[];
  highlights: string[];
  ctaLabel: string;
  ctaUrl: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function draftFromSite(site: RecruiterSite): Draft {
  return {
    slug: site.slug,
    template: site.template,
    theme: site.theme,
    tagline: site.tagline,
    intro: site.intro,
    specialisms: site.specialisms,
    highlights: site.highlights,
    ctaLabel: site.ctaLabel,
    ctaUrl: site.ctaUrl,
  };
}

type Step = 1 | 2 | 3;
const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Link & look" },
  { n: 2, label: "Content" },
  { n: 3, label: "Publish" },
];

export function SiteBuilderWizard() {
  const { profile } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<RecruiterSite | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>({
    slug: "",
    template: "classic",
    theme: "navy",
    tagline: "",
    intro: "",
    specialisms: [],
    highlights: [],
    ctaLabel: "Get in touch",
    ctaUrl: "",
  });
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMySite()
      .then((site) => {
        if (!active) return;
        if (site) {
          setExisting(site);
          setDraft(draftFromSite(site));
        } else if (profile?.name) {
          setDraft((d) => ({ ...d, slug: slugify(profile.name) }));
        }
      })
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
    // Only seed once on mount — re-running on every profile change would
    // stomp on a slug the recruiter has already started editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch(p: Partial<Draft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  async function save(publish: boolean) {
    setError(null);
    setNotice(null);
    const slugIssue = slugProblem(draft.slug);
    if (slugIssue) {
      setError(slugIssue);
      setStep(1);
      return;
    }
    setSaving(publish ? "publish" : "draft");
    try {
      const saved = await saveMySite({ ...draft, published: publish });
      setExisting(saved);
      setNotice(
        publish
          ? `Your site is live at jobfolder.com/sites/${saved.slug}`
          : "Saved as a draft — not visible to the public until you publish.",
      );
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Could not save your site.");
    } finally {
      setSaving(null);
    }
  }

  if (!loaded) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8">
        <div className="h-5 w-40 animate-pulse rounded bg-line" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-line" />
      </div>
    );
  }

  const previewRecruiter = {
    name: profile?.name ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    photoURL: profile?.photoURL ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
    linkedin: profile?.linkedin ?? "",
    website: profile?.website ?? "",
    twitter: profile?.twitter ?? "",
    facebook: profile?.facebook ?? "",
    instagram: profile?.instagram ?? "",
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <div className="rounded-2xl border border-line bg-white p-6">
        {existing?.published && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sage/50 bg-sage-soft px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">
              Live at{" "}
              <Link
                href={`/sites/${existing.slug}`}
                target="_blank"
                className="underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
              >
                jobfolder.com/sites/{existing.slug}
              </Link>
            </p>
          </div>
        )}

        <Stepper current={step} onSelect={setStep} />

        {step === 1 && (
          <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-ink">Your link</h3>
              <p className="mt-1 text-sm text-muted">
                This is the address your site will live at.
              </p>
              <div className="mt-3 flex items-center gap-1 rounded-xl border border-line bg-cream/40 px-3.5 py-2.5">
                <span className="shrink-0 text-sm text-muted">jobfolder.com/sites/</span>
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-semibold text-ink outline-none"
                  value={draft.slug}
                  onChange={(e) => patch({ slug: slugify(e.target.value) })}
                  placeholder="jordan-lee"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink">Template</h3>
              <p className="mt-1 text-sm text-muted">Pick the layout for your page.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {SITE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => patch({ template: t.id })}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      draft.template === t.id
                        ? "border-primary bg-primary-soft"
                        : "border-line hover:border-primary/50"
                    }`}
                  >
                    <p className="text-sm font-bold text-ink">{t.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink">Colour</h3>
              <p className="mt-1 text-sm text-muted">Sets the accent colour throughout.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {SITE_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => patch({ theme: t.id })}
                    title={t.label}
                    className={`grid h-11 w-11 place-items-center rounded-full transition-shadow ${
                      draft.theme === t.id ? "ring-2 ring-ink ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: t.accent }}
                  >
                    {draft.theme === t.id && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <path d="M4 10l4 4 8-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-5">
            <Field label="Tagline (optional)" hint={`Defaults to "${profile?.headline || "your profile headline"}" if left blank.`}>
              <input
                className="input"
                value={draft.tagline}
                onChange={(e) => patch({ tagline: e.target.value })}
                placeholder="Technical recruiter, civil & structural"
              />
            </Field>
            <Field label="About (optional)" hint="Defaults to your profile bio if left blank.">
              <textarea
                className="input min-h-28 resize-y"
                value={draft.intro}
                onChange={(e) => patch({ intro: e.target.value })}
                placeholder="A short story about how you work and who you help…"
              />
            </Field>
            <TagListField
              label="Specialisms (optional)"
              placeholder="e.g. Structural Engineering"
              items={draft.specialisms}
              onChange={(specialisms) => patch({ specialisms })}
              max={12}
            />
            <TagListField
              label="Track record highlights (optional)"
              placeholder="e.g. 50+ engineers placed since 2019"
              items={draft.highlights}
              onChange={(highlights) => patch({ highlights })}
              max={12}
              itemMax={200}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button label (optional)">
                <input
                  className="input"
                  value={draft.ctaLabel}
                  onChange={(e) => patch({ ctaLabel: e.target.value })}
                  placeholder="Get in touch"
                />
              </Field>
              <Field label="Button link (optional)">
                <input
                  className="input"
                  value={draft.ctaUrl}
                  onChange={(e) => patch({ ctaUrl: e.target.value })}
                  placeholder={profile?.email ? `mailto:${profile.email}` : "https://…"}
                />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-5">
            <h3 className="text-lg font-bold text-ink">Ready to publish?</h3>
            <p className="mt-1 text-sm text-muted">
              Publishing makes your site live at{" "}
              <span className="font-mono text-xs">jobfolder.com/sites/{draft.slug || "…"}</span>.
              You can keep editing and re-publish anytime.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">{error}</p>
        )}
        {notice && !error && (
          <p className="mt-5 rounded-lg bg-sage-soft px-3 py-2 text-sm text-ink">{notice}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving !== null}
            className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream disabled:opacity-60"
          >
            {saving === "draft" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving !== null}
            className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {saving === "publish" ? "Publishing…" : existing?.published ? "Save & keep live" : "Publish site"}
          </button>
        </div>
      </div>

      {/* live preview */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Live preview</p>
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-line bg-cream/60 px-3.5 py-2">
            <span className="h-2 w-2 rounded-full bg-coral/60" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-lime/60" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-primary/40" aria-hidden />
            <span className="ml-2 truncate text-[11px] text-muted">
              jobfolder.com/sites/{draft.slug || "…"}
            </span>
          </div>
          <div className="h-160 overflow-y-auto">
            <RecruiterSiteView
              site={{
                template: draft.template,
                theme: draft.theme,
                tagline: draft.tagline,
                intro: draft.intro,
                specialisms: draft.specialisms,
                highlights: draft.highlights,
                ctaLabel: draft.ctaLabel,
                ctaUrl: draft.ctaUrl,
              }}
              recruiter={previewRecruiter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ current, onSelect }: { current: Step; onSelect: (s: Step) => void }) {
  return (
    <div className="flex items-center border-b border-line pb-4">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <button
            type="button"
            onClick={() => onSelect(s.n)}
            className="flex items-center gap-1.5"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                current === s.n ? "bg-primary text-white" : "border border-line text-muted"
              }`}
            >
              {s.n}
            </span>
            <span className={`text-sm font-semibold ${current >= s.n ? "text-ink" : "text-muted"}`}>
              {s.label}
            </span>
          </button>
          {i < STEPS.length - 1 && <span className="mx-2.5 h-px w-6 bg-line sm:w-10" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function TagListField({
  label, placeholder, items, onChange, max, itemMax = 60,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  itemMax?: number;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim().slice(0, itemMax);
    if (!value || items.length >= max || items.includes(value)) return;
    onChange([...items, value]);
    setDraft("");
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          disabled={items.length >= max}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || items.length >= max}
          className="shrink-0 rounded-pill border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-1.5 rounded-pill bg-cream px-3 py-1 text-xs font-medium text-ink"
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${item}`}
                className="text-muted hover:text-coral"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
