"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import type { Job } from "@/lib/jobs";
import { feeTierMeta } from "@/lib/feeTiers";
import { timeAgo, toMillis } from "@/lib/dates";

/* Profile completeness bar. Exposed to assistive tech as a real progressbar
   rather than a decorative div, since the number it carries is the whole
   point of it. */
export function ProfileMeter({
  percent,
  className = "",
}: {
  percent: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Profile completeness"
      className={`h-2 w-full overflow-hidden rounded-pill bg-line ${className}`}
    >
      <div
        className="h-full rounded-pill bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

const badgeTone: Record<SubmissionStatus, string> = {
  submitted: "bg-line text-muted",
  screening: "bg-coral-soft text-coral",
  approved: "bg-primary-soft text-primary",
  client_review: "bg-primary-soft text-primary",
  hired: "bg-primary text-white",
  rejected: "bg-coral-soft text-coral",
};

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex rounded-pill px-2 py-0.5 text-[11px] font-semibold ${badgeTone[status]}`}
    >
      {SUBMISSION_STATUS_LABEL[status]}
    </span>
  );
}

export function money(n: number | null | undefined): string {
  return n != null ? `$${n.toLocaleString()}` : "—";
}

/* --------------------------------------------------------- Hiring pipeline */

/* Rejected candidates are left out of this table on purpose: it tracks where
   active referrals stand, not a record of declines — that lives on the
   submissions list instead. */
const PIPELINE_STAGES: SubmissionStatus[] = [
  "submitted",
  "screening",
  "approved",
  "client_review",
  "hired",
];

const STAGE_PILL: Record<SubmissionStatus, string> = {
  submitted: "bg-line text-muted",
  screening: "bg-coral-soft text-coral",
  approved: "bg-blue-brand-soft text-primary",
  client_review: "bg-sage-soft text-ink",
  hired: "bg-primary text-white",
  rejected: "bg-line text-muted",
};

type PipelineRow = {
  jobTitle: string;
  counts: Record<SubmissionStatus, number>;
};

/** One row per job the recruiter has referred into, columns = pipeline stage. */
export function HiringPipeline({ subs }: { subs: Submission[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, PipelineRow>();
    for (const s of subs) {
      if (s.status === "rejected") continue;
      const key = s.jobTitle || "Untitled role";
      if (!map.has(key)) {
        map.set(key, {
          jobTitle: key,
          counts: {
            submitted: 0, screening: 0, approved: 0, client_review: 0, hired: 0, rejected: 0,
          },
        });
      }
      map.get(key)!.counts[s.status] += 1;
    }
    return [...map.values()].sort((a, b) => {
      const totalOf = (r: PipelineRow) => PIPELINE_STAGES.reduce((n, st) => n + r.counts[st], 0);
      return totalOf(b) - totalOf(a);
    });
  }, [subs]);

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-ink">Hiring</h2>
        <Link
          href="/dashboard/submissions"
          className="text-xs font-semibold text-primary hover:text-primary-dark"
        >
          View all →
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted">
          No candidates submitted yet — browse open jobs to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-left text-xs">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted">
                <th className="pb-2 pr-3 font-semibold">Job</th>
                {PIPELINE_STAGES.map((st) => (
                  <th key={st} className="pb-2 pr-2 font-semibold">
                    {SUBMISSION_STATUS_LABEL[st]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.slice(0, 6).map((row) => (
                <tr key={row.jobTitle}>
                  <td className="py-2 pr-3 font-semibold text-ink">{row.jobTitle}</td>
                  {PIPELINE_STAGES.map((st) => (
                    <td key={st} className="py-2 pr-2">
                      {row.counts[st] > 0 ? (
                        <span
                          className={`inline-flex min-w-8 justify-center rounded-lg px-2 py-1 text-[11px] font-bold ${STAGE_PILL[st]}`}
                        >
                          {row.counts[st]}
                        </span>
                      ) : (
                        <span className="block h-6 w-full rounded-lg bg-cream/60" aria-hidden />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Recent activity */

const STATUS_DOT: Record<SubmissionStatus, string> = {
  submitted: "bg-muted",
  screening: "bg-coral",
  approved: "bg-primary",
  client_review: "bg-primary",
  hired: "bg-lime",
  rejected: "bg-coral",
};

/** Latest submissions, newest first — a running feed of the recruiter's own activity. */
export function RecentActivity({ subs }: { subs: Submission[] }) {
  const recent = useMemo(
    () => [...subs].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)).slice(0, 5),
    [subs],
  );

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-ink">Recent activity</h2>
        <Link
          href="/dashboard/submissions"
          className="text-xs font-semibold text-primary hover:text-primary-dark"
        >
          View all →
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-xs text-muted">
          Your submitted candidates will show up here.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {recent.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/submissions/${s.id}`}
                className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2 transition-colors hover:border-primary"
              >
                <span className={`h-7 w-1.5 shrink-0 rounded-full ${STATUS_DOT[s.status]}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-ink">
                    {s.candidateName}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {s.jobTitle} · {SUBMISSION_STATUS_LABEL[s.status]}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted">{timeAgo(s.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------------- Open roles for you */

/* Deterministic pastel tone per job, purely cosmetic — same reasoning as
   submissionRef in lib/submissions.ts: stable per id, not meant as a secret. */
const AVATAR_TONES = [
  { bg: "bg-blue-brand-soft", text: "text-primary" },
  { bg: "bg-coral-soft", text: "text-coral" },
  { bg: "bg-sage-soft", text: "text-ink" },
  { bg: "bg-cream-deep", text: "text-ink" },
];

function toneFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** A short list of open roles to nudge the recruiter toward referring into. */
export function OpenRolesForYou({ jobs }: { jobs: Job[] }) {
  const top = jobs.slice(0, 5);

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-ink">Open roles for you</h2>
        <Link
          href="/dashboard/jobs"
          className="text-xs font-semibold text-primary hover:text-primary-dark"
        >
          View all →
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-muted">No open roles right now — check back soon.</p>
      ) : (
        <ul className="space-y-1.5">
          {top.map((job) => {
            const tone = toneFor(job.id);
            const fee = feeTierMeta(job.feeTier);
            const initials = (job.company || job.title).slice(0, 2).toUpperCase();
            return (
              <li key={job.id}>
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2 transition-colors hover:border-primary"
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${tone.bg} ${tone.text}`}
                    aria-hidden
                  >
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-ink">
                      {job.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {job.company || "Confidential"}{job.location ? ` · ${job.location}` : ""}
                    </span>
                  </span>
                  {fee && (
                    <span className="shrink-0 rounded-pill bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">
                      {money(fee.amount)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
