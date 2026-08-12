"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRoutes } from "@/lib/routes";
import { getCategories, DEFAULT_CATEGORIES } from "@/lib/categories";
import { getBoardFilters, DEFAULT_FILTERS, type BoardFilters } from "@/lib/boardFilters";
import { FEE_TIERS, feeTierMeta } from "@/lib/feeTiers";
import {
  DEFAULT_HIRING_STAGES,
  createJob,
  updateJob,
  type Job,
  type JobInput,
  type JobStatus,
  type FAQ,
} from "@/lib/jobs";

const STATUSES: JobStatus[] = ["draft", "open", "closed"];

const STEPS = [
  { label: "Job details", title: "Let's Get Started", subtitle: "Tell us about the position you need to fill." },
  { label: "Description", title: "Describe the Role", subtitle: "Give recruiters everything they need to pitch this job." },
  { label: "Screening", title: "Screening Questions", subtitle: "What should a recruiter ask before submitting a candidate?" },
  { label: "Hiring process", title: "Hiring Process", subtitle: "The stages a candidate moves through for this role." },
  { label: "Review & publish", title: "Review & Publish", subtitle: "Double check the details before this goes live." },
] as const;

function emptyDraft(): JobInput {
  return {
    title: "",
    company: "",
    category: "Civil Engineering",
    location: "",
    remote: false,
    employmentType: "Full-time",
    salaryMin: null,
    salaryMax: null,
    bounty: null,
    feeTier: null,
    description: "",
    responsibilities: "",
    requirements: "",
    faqs: [],
    screeningQuestions: [],
    hiringStages: [...DEFAULT_HIRING_STAGES],
    status: "draft",
  };
}

function fromJob(job: Job): JobInput {
  const { id, createdAt, updatedAt, ...rest } = job;
  void id;
  void createdAt;
  void updatedAt;
  return rest;
}

export function JobWizard({ job }: { job?: Job }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<JobInput>(job ? fromJob(job) : emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof JobInput>(key: K, value: JobInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const num = (v: string) => (v.trim() === "" ? null : Number(v) || null);

  const canContinue = step !== 0 || (form.title.trim() && form.company.trim());
  const last = step === STEPS.length - 1;

  async function publish() {
    setError(null);
    setSaving(true);
    try {
      if (job) await updateJob(job.id, form);
      else await createJob(form);
      router.push(adminRoutes.jobs);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the job.");
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {/* Horizontal step indicator — numbered circles joined by a progress
          line, so where you are in a 5-step form reads at a glance instead
          of requiring a scan down a sidebar list. */}
      <div className="border-b border-line px-6 py-6 sm:px-8">
        <ol className="flex items-center">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                <button
                  type="button"
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className={`flex shrink-0 flex-col items-center gap-2 ${i <= step ? "" : "cursor-default"}`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${
                      done || active
                        ? "bg-ink text-white"
                        : "border-2 border-line text-muted"
                    }`}
                  >
                    {done ? (
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className={`hidden text-xs font-semibold sm:block ${active ? "text-ink" : "text-muted"}`}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className={`mx-2 mb-6 h-0.5 flex-1 sm:mb-7 ${done ? "bg-ink" : "bg-line"}`} />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* content */}
      <div className="p-6 lg:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-ink">
          {STEPS[step].title}
        </h2>
        <p className="mt-1 text-sm text-muted">{STEPS[step].subtitle}</p>
        <div className="mt-6">
          {step === 0 && <BasicInfo form={form} set={set} num={num} />}
          {step === 1 && <Description form={form} set={set} />}
          {step === 2 && <Questions form={form} set={set} />}
          {step === 3 && <Hiring form={form} set={set} />}
          {step === 4 && <Confirm form={form} />}
        </div>

        {error && (
          <p className="mt-6 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        {/* footer */}
        <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
          {step === 0 ? (
            <button
              type="button"
              onClick={() => router.push(adminRoutes.jobs)}
              className="rounded-pill border border-line px-6 py-2.5 text-sm font-semibold text-ink hover:bg-black/[0.03]"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-pill border border-line px-6 py-2.5 text-sm font-semibold text-ink hover:bg-black/[0.03]"
            >
              ← Previous
            </button>
          )}
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">
              Step {step + 1} of {STEPS.length}
            </span>
            {last ? (
              <button
                type="button"
                onClick={publish}
                disabled={saving}
                className="rounded-pill bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {saving ? "Publishing…" : job ? "Save changes" : "Publish job"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => canContinue && setStep((s) => s + 1)}
                disabled={!canContinue}
                className="rounded-pill bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Next step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- steps ---------- */

type StepProps = {
  form: JobInput;
  set: <K extends keyof JobInput>(k: K, v: JobInput[K]) => void;
};

function BasicInfo({ form, set, num }: StepProps & { num: (v: string) => number | null }) {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  useEffect(() => { getCategories().then(setCategories); }, []);
  /* Job types come from the console too, so this form offers exactly what the
     API will accept — see allowedEmploymentTypes() in app/api/admin/jobWrite.ts. */
  useEffect(() => { getBoardFilters().then(setFilters); }, []);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Job title" full>
        <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Senior Backend Engineer" />
      </Field>
      <Field label="Client company">
        <input className="input" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Inc." />
      </Field>
      <Field label="Category / vertical">
        <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Location">
        <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Dallas, TX" />
      </Field>
      <Field label="Employment type">
        <select className="input" value={form.employmentType} onChange={(e) => set("employmentType", e.target.value as JobInput["employmentType"])}>
          {filters.employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Salary min">
        <input className="input" type="number" min={0} value={form.salaryMin ?? ""} onChange={(e) => set("salaryMin", num(e.target.value))} placeholder="60000" />
      </Field>
      <Field label="Salary max">
        <input className="input" type="number" min={0} value={form.salaryMax ?? ""} onChange={(e) => set("salaryMax", num(e.target.value))} placeholder="90000" />
      </Field>
      <Field label="Recruiter fee tier — what recruiters see and earn">
        <select
          className="input"
          value={form.feeTier ?? ""}
          onChange={(e) => set("feeTier", e.target.value || null)}
        >
          <option value="">No tier set — hides the fee badge</option>
          {FEE_TIERS.map((t) => (
            <option key={t.value} value={t.value}>
              ${t.amount.toLocaleString()} — {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Client fee (internal — never shown to recruiters)">
        <input className="input" type="number" min={0} value={form.bounty ?? ""} onChange={(e) => set("bounty", num(e.target.value))} placeholder="8000" />
      </Field>
      <Field label="Status">
        <select className="input" value={form.status} onChange={(e) => set("status", e.target.value as JobStatus)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </Field>
      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" checked={form.remote} onChange={(e) => set("remote", e.target.checked)} className="h-4 w-4 accent-primary" />
        <span className="text-sm text-ink">Remote-friendly</span>
      </label>
    </div>
  );
}

function Description({ form, set }: StepProps) {
  function setFaq(i: number, patch: Partial<FAQ>) {
    const next = form.faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f));
    set("faqs", next);
  }
  return (
    <div className="space-y-5">
      <Field label="Job brief">
        <textarea className="input min-h-32 resize-y" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="A short overview of the role and what it involves…" />
      </Field>
      <Field label="Responsibilities">
        <textarea className="input min-h-28 resize-y" value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder="One per line…" />
      </Field>
      <Field label="Requirements and skills">
        <textarea className="input min-h-28 resize-y" value={form.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder="One per line…" />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Frequently asked questions</p>
        <div className="space-y-3">
          {form.faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-line bg-cream/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Question {i + 1}</span>
                <button type="button" onClick={() => set("faqs", form.faqs.filter((_, idx) => idx !== i))} className="text-xs font-semibold text-coral">Remove</button>
              </div>
              <input className="input mb-2" value={f.question} onChange={(e) => setFaq(i, { question: e.target.value })} placeholder="What does this role involve?" />
              <textarea className="input min-h-20 resize-y" value={f.answer} onChange={(e) => setFaq(i, { answer: e.target.value })} placeholder="Answer…" />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("faqs", [...form.faqs, { question: "", answer: "" }])} className="mt-3 text-sm font-semibold text-primary hover:text-primary-dark">
          + Add question
        </button>
      </div>
    </div>
  );
}

function Questions({ form, set }: StepProps) {
  return (
    <div>
      <p className="text-sm text-muted">
        Questions applicants must answer when submitting a candidate for this role.
      </p>
      <div className="mt-4 space-y-2">
        {form.screeningQuestions.map((qn, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
            <input
              className="input"
              value={qn}
              onChange={(e) => set("screeningQuestions", form.screeningQuestions.map((v, idx) => (idx === i ? e.target.value : v)))}
              placeholder="e.g. How many years of relevant experience?"
            />
            <button type="button" onClick={() => set("screeningQuestions", form.screeningQuestions.filter((_, idx) => idx !== i))} className="text-sm font-semibold text-coral">Remove</button>
          </div>
        ))}
        {form.screeningQuestions.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">No questions yet — this is optional.</p>
        )}
      </div>
      <button type="button" onClick={() => set("screeningQuestions", [...form.screeningQuestions, ""])} className="mt-3 text-sm font-semibold text-primary hover:text-primary-dark">
        + Add question
      </button>
    </div>
  );
}

function Hiring({ form, set }: StepProps) {
  return (
    <div>
      <p className="text-sm text-muted">The stages a candidate moves through for this role.</p>
      <div className="mt-4 space-y-2">
        {form.hiringStages.map((st, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
            <input
              className="input"
              value={st}
              onChange={(e) => set("hiringStages", form.hiringStages.map((v, idx) => (idx === i ? e.target.value : v)))}
              placeholder="Stage name"
            />
            <button type="button" onClick={() => set("hiringStages", form.hiringStages.filter((_, idx) => idx !== i))} className="text-sm font-semibold text-coral">Remove</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => set("hiringStages", [...form.hiringStages, ""])} className="mt-3 text-sm font-semibold text-primary hover:text-primary-dark">
        + Add stage
      </button>
    </div>
  );
}

function Confirm({ form }: { form: JobInput }) {
  return (
    <div className="space-y-5 text-sm">
      <p className="text-muted">Review the role before publishing.</p>
      <Row label="Title" value={form.title || "—"} />
      <Row label="Company" value={form.company || "—"} />
      <Row label="Category" value={form.category} />
      <Row label="Location" value={`${form.location || "—"}${form.remote ? " · Remote" : ""}`} />
      <Row label="Type" value={form.employmentType} />
      <Row label="Salary" value={form.salaryMin || form.salaryMax ? `${form.salaryMin ?? "?"} – ${form.salaryMax ?? "?"}` : "—"} />
      <Row label="Recruiter fee (public)" value={feeTierMeta(form.feeTier)?.label ? `$${feeTierMeta(form.feeTier)!.amount.toLocaleString()} — ${feeTierMeta(form.feeTier)!.label}` : "No tier set"} />
      <Row label="Client fee (internal)" value={form.bounty != null ? `$${form.bounty.toLocaleString()}` : "—"} />
      <Row label="FAQs" value={`${form.faqs.length}`} />
      <Row label="Screening questions" value={`${form.screeningQuestions.length}`} />
      <Row label="Hiring stages" value={form.hiringStages.filter(Boolean).join(" → ") || "—"} />
      <Row label="Status" value={form.status} highlight />
    </div>
  );
}

/* ---------- shared bits ---------- */
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line pb-2">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold ${highlight ? "capitalize text-primary" : "text-ink"}`}>{value}</span>
    </div>
  );
}
