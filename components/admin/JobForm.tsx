"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminRoutes } from "@/lib/routes";
import {
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  createJob,
  updateJob,
  type Job,
  type JobInput,
  type JobStatus,
} from "@/lib/jobs";

const STATUSES: JobStatus[] = ["draft", "open", "closed"];

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
    description: "",
    status: "draft",
  };
}

/* Shared create/edit form. Pass an existing `job` to edit it. */
export function JobForm({ job }: { job?: Job }) {
  const router = useRouter();
  const [form, setForm] = useState<JobInput>(
    job
      ? {
          title: job.title,
          company: job.company,
          category: job.category,
          location: job.location,
          remote: job.remote,
          employmentType: job.employmentType,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          bounty: job.bounty,
          description: job.description,
          status: job.status,
        }
      : emptyDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof JobInput>(key: K, value: JobInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function num(value: string): number | null {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (job) await updateJob(job.id, form);
      else await createJob(form);
      router.push(adminRoutes.base);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the job. Try again.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-sm font-bold text-ink">Role details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Job title" className="sm:col-span-2">
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Senior Backend Engineer"
            />
          </Field>
          <Field label="Client company">
            <input
              className="input"
              required
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Acme Inc."
            />
          </Field>
          <Field label="Category / vertical">
            <select
              className="input"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="London, UK"
            />
          </Field>
          <Field label="Employment type">
            <select
              className="input"
              value={form.employmentType}
              onChange={(e) =>
                set("employmentType", e.target.value as JobInput["employmentType"])
              }
            >
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 pt-7">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => set("remote", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-ink">Remote-friendly</span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-sm font-bold text-ink">Compensation & bounty</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Salary min">
            <input
              className="input"
              type="number"
              min={0}
              value={form.salaryMin ?? ""}
              onChange={(e) => set("salaryMin", num(e.target.value))}
              placeholder="60000"
            />
          </Field>
          <Field label="Salary max">
            <input
              className="input"
              type="number"
              min={0}
              value={form.salaryMax ?? ""}
              onChange={(e) => set("salaryMax", num(e.target.value))}
              placeholder="90000"
            />
          </Field>
          <Field label="Recruiter bounty">
            <input
              className="input"
              type="number"
              min={0}
              value={form.bounty ?? ""}
              onChange={(e) => set("bounty", num(e.target.value))}
              placeholder="8000"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-sm font-bold text-ink">Description</h2>
        <div className="mt-4 space-y-4">
          <Field label="Role description">
            <textarea
              className="input min-h-40 resize-y"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What the role involves, must-have skills, and what makes a great candidate…"
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value as JobStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving…" : job ? "Save changes" : "Post job"}
        </button>
        <Link
          href={adminRoutes.base}
          className="rounded-pill border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-black/[0.02]"
        >
          Cancel
        </Link>
      </div>
    </form>
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
