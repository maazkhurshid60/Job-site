"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  getMySite, saveMySite, type RecruiterSite, type SiteStat, type SiteExpertise, type SiteExperience,
} from "@/lib/recruiterSite";
import {
  SITE_TEMPLATES, SITE_THEMES, slugProblem, type SiteTemplate, type SiteThemeId,
} from "@/lib/siteThemes";
import { RecruiterSiteView } from "@/components/site/RecruiterSiteView";
import { ScaledPreview } from "@/components/dashboard/ScaledPreview";

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
  stats: SiteStat[];
  expertise: SiteExpertise[];
  experience: SiteExperience[];
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
    stats: site.stats,
    expertise: site.expertise,
    experience: site.experience,
    ctaLabel: site.ctaLabel,
    ctaUrl: site.ctaUrl,
  };
}

type Step = 1 | 2 | 3 | 4 | 5;
const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Link & look" },
  { n: 2, label: "About" },
  { n: 3, label: "Experience" },
  { n: 4, label: "Extras" },
  { n: 5, label: "Publish" },
];

export function SiteBuilderWizard() {
  const { profile } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState<RecruiterSite | null>(null);
  const [step, setStep] = useState<Step>(1);
  // How far the recruiter has actually progressed — steps beyond this aren't
  // clickable yet. Someone editing an already-built site starts with every
  // step unlocked (see the load effect below); a fresh site is locked to
  // step-by-step progression via Continue.
  const [maxStep, setMaxStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>({
    slug: "",
    template: "classic",
    theme: "navy",
    tagline: "",
    intro: "",
    specialisms: [],
    highlights: [],
    stats: [],
    expertise: [],
    experience: [],
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
          setMaxStep(5); // already built — every step is fair game to jump to
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

  function goNext() {
    // Only step 1 has anything to actually validate — every later step is
    // optional content. Blocking there for a genuinely optional field would
    // fight the whole "everything falls back to your profile" design.
    if (step === 1) {
      const slugIssue = slugProblem(draft.slug);
      if (slugIssue) {
        setError(slugIssue);
        return;
      }
    }
    setError(null);
    const next = Math.min(5, step + 1) as Step;
    setStep(next);
    setMaxStep((m) => (next > m ? next : m));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1) as Step);
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
    location: profile?.location ?? "",
    linkedin: profile?.linkedin ?? "",
    website: profile?.website ?? "",
    twitter: profile?.twitter ?? "",
    facebook: profile?.facebook ?? "",
    instagram: profile?.instagram ?? "",
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_600px]">
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

        <Stepper current={step} maxStep={maxStep} onSelect={setStep} />

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
            <StatsField items={draft.stats} onChange={(stats) => patch({ stats })} />
            <ExpertiseField items={draft.expertise} onChange={(expertise) => patch({ expertise })} />
          </div>
        )}

        {step === 3 && (
          <div className="mt-5">
            <ExperienceField items={draft.experience} onChange={(experience) => patch({ experience })} />
          </div>
        )}

        {step === 4 && (
          <div className="mt-5 space-y-5">
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

        {step === 5 && (
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
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving !== null}
            className="rounded-pill border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-cream disabled:opacity-60"
          >
            {saving === "draft" ? "Saving…" : "Save draft"}
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving !== null}
              className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {saving === "publish" ? "Publishing…" : existing?.published ? "Save & keep live" : "Publish site"}
            </button>
          )}
        </div>
      </div>

      {/* live preview */}
      <div className="xl:sticky xl:top-6 xl:self-start">
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
          <div className="h-192 overflow-y-auto">
            <ScaledPreview>
              <RecruiterSiteView
                site={{
                  template: draft.template,
                  theme: draft.theme,
                  tagline: draft.tagline,
                  intro: draft.intro,
                  specialisms: draft.specialisms,
                  highlights: draft.highlights,
                  stats: draft.stats,
                  expertise: draft.expertise,
                  experience: draft.experience,
                  ctaLabel: draft.ctaLabel,
                  ctaUrl: draft.ctaUrl,
                }}
                recruiter={previewRecruiter}
              />
            </ScaledPreview>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({
  current, maxStep, onSelect,
}: { current: Step; maxStep: Step; onSelect: (s: Step) => void }) {
  return (
    <div className="flex items-center border-b border-line pb-4">
      {STEPS.map((s, i) => {
        const reached = s.n <= maxStep;
        const done = s.n < current;
        return (
          <div key={s.n} className="flex items-center">
            <button
              type="button"
              onClick={() => reached && onSelect(s.n)}
              disabled={!reached}
              className={`flex items-center gap-1.5 ${reached ? "" : "cursor-not-allowed opacity-50"}`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-sage text-white"
                    : current === s.n
                      ? "bg-primary text-white"
                      : "border border-line text-muted"
                }`}
              >
                {done ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  s.n
                )}
              </span>
              <span className={`text-sm font-semibold ${current >= s.n ? "text-ink" : "text-muted"}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && <span className="mx-2.5 h-px w-6 bg-line sm:w-10" aria-hidden />}
          </div>
        );
      })}
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

/** A vertical list of longer, sentence-length entries (job bullet points) —
    same add/remove interaction as TagListField, but rendered as a bulleted
    list rather than pill chips, since a full sentence doesn't read well as a
    pill. */
function BulletListField({
  items, onChange, max = 8,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  max?: number;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value || items.length >= max) return;
    onChange([...items, value]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          className="input text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a bullet point…"
          disabled={items.length >= max}
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim() || items.length >= max}
          className="shrink-0 rounded-pill border border-line px-3 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink/40" />
              <span className="flex-1">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label="Remove bullet"
                className="shrink-0 text-muted hover:text-coral"
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

/** Hero stat row — short value/label pairs, e.g. "8+" / "Years recruiting". */
function StatsField({
  items, onChange, max = 4,
}: {
  items: SiteStat[];
  onChange: (items: SiteStat[]) => void;
  max?: number;
}) {
  function update(i: number, patch: Partial<SiteStat>) {
    onChange(items.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    if (items.length >= max) return;
    onChange([...items, { value: "", label: "" }]);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">Hero stats (optional)</span>
      <p className="mb-2 text-[11px] text-muted">
        Short numbers shown at the top of your site, e.g. &ldquo;8+&rdquo; / &ldquo;Years recruiting&rdquo;.
      </p>
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input w-24"
              value={s.value}
              onChange={(e) => update(i, { value: e.target.value })}
              placeholder="8+"
            />
            <input
              className="input flex-1"
              value={s.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Years recruiting"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove stat"
              className="shrink-0 text-muted hover:text-coral"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={items.length >= max}
        className="mt-2 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
      >
        + Add stat
      </button>
    </div>
  );
}

/** Animated skill bars, e.g. "DOT Recruiting — 90%". */
function ExpertiseField({
  items, onChange, max = 8,
}: {
  items: SiteExpertise[];
  onChange: (items: SiteExpertise[]) => void;
  max?: number;
}) {
  function update(i: number, patch: Partial<SiteExpertise>) {
    onChange(items.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    if (items.length >= max) return;
    onChange([...items, { skill: "", percent: 80 }]);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">Core expertise (optional)</span>
      <p className="mb-2 text-[11px] text-muted">
        Shown as skill bars, e.g. &ldquo;DOT Recruiting — 90%&rdquo;.
      </p>
      <div className="space-y-2">
        {items.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input flex-1"
              value={e.skill}
              onChange={(ev) => update(i, { skill: ev.target.value })}
              placeholder="e.g. DOT Recruiting"
            />
            <input
              className="input w-20"
              type="number"
              min={0}
              max={100}
              value={e.percent}
              onChange={(ev) => update(i, { percent: Math.max(0, Math.min(100, Number(ev.target.value) || 0)) })}
            />
            <span className="shrink-0 text-xs text-muted">%</span>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove skill"
              className="shrink-0 text-muted hover:text-coral"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={items.length >= max}
        className="mt-2 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
      >
        + Add skill
      </button>
    </div>
  );
}

/** Work-history timeline — the "Where I've worked" section. Each role is a
    small card of its own fields plus a BulletListField for the achievements
    under it. */
function ExperienceField({
  items, onChange, max = 6,
}: {
  items: SiteExperience[];
  onChange: (items: SiteExperience[]) => void;
  max?: number;
}) {
  function update(i: number, patch: Partial<SiteExperience>) {
    onChange(items.map((job, idx) => (idx === i ? { ...job, ...patch } : job)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    if (items.length >= max) return;
    onChange([...items, { role: "", company: "", period: "", current: false, bullets: [] }]);
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-ink">Work history (optional)</h3>
      <p className="mt-1 text-sm text-muted">
        Most recent role first — this becomes your &ldquo;Where I&apos;ve worked&rdquo; timeline.
      </p>

      <div className="mt-4 space-y-4">
        {items.map((job, i) => (
          <div key={i} className="rounded-xl border border-line p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">Role {i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs font-semibold text-coral hover:underline"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                value={job.role}
                onChange={(e) => update(i, { role: e.target.value })}
                placeholder="Role, e.g. Senior Recruiter"
              />
              <input
                className="input"
                value={job.company}
                onChange={(e) => update(i, { company: e.target.value })}
                placeholder="Company"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                className="input min-w-0 flex-1"
                value={job.period}
                onChange={(e) => update(i, { period: e.target.value })}
                placeholder="Period, e.g. Jan 2022 – Present"
              />
              <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink">
                <input
                  type="checkbox"
                  checked={job.current}
                  onChange={(e) => update(i, { current: e.target.checked })}
                />
                Current role
              </label>
            </div>
            <div className="mt-3">
              <BulletListField items={job.bullets} onChange={(bullets) => update(i, { bullets })} max={8} />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={items.length >= max}
        className="mt-4 rounded-pill border border-line px-4 py-2 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-50"
      >
        + Add role
      </button>
    </div>
  );
}
