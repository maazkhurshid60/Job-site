"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getJobAsAdmin, deleteJob, type Job } from "@/lib/jobs";
import {
  listAllSubmissions,
  setSubmissionStatus,
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import { money } from "@/components/dashboard/parts";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { SubmissionDetail } from "@/components/admin/SubmissionDetail";
import { adminRoutes } from "@/lib/routes";
import { formatDate } from "@/lib/dates";
import { downloadCsv } from "@/lib/csv";

/* One role, in full — everything on the posting plus every candidate referred
   for it. getJobAsAdmin is used rather than getJob: the public endpoint only
   serves `open` roles, so a draft or closed job would 404 here. */

const statusStyle: Record<Job["status"], string> = {
  open: "bg-primary-soft text-primary",
  draft: "bg-line text-muted",
  closed: "bg-coral-soft text-coral",
};

export default function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      /* Submissions are allowed to fail on their own: not being able to list
         candidates is no reason to hide the role itself. */
      const [j, all] = await Promise.all([
        getJobAsAdmin(id),
        listAllSubmissions().catch(() => [] as Submission[]),
      ]);
      setJob(j);
      setSubs(all.filter((s) => s.jobId === id));
    } catch (err) {
      setError(errorMessage(err, "The server didn't respond. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(sub: Submission, status: SubmissionStatus) {
    const prev = sub.status;
    setSubs((list) => list.map((s) => (s.id === sub.id ? { ...s, status } : s)));
    try {
      await setSubmissionStatus(sub.id, status);
    } catch {
      setSubs((list) => list.map((s) => (s.id === sub.id ? { ...s, status: prev } : s)));
      alert("Could not update status.");
    }
  }

  function exportCsv() {
    if (!job) return;
    downloadCsv(
      `${job.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-candidates.csv`,
      subs.map((s) => ({
        Candidate: s.candidateName,
        Email: s.candidateEmail,
        Phone: s.candidatePhone,
        Status: SUBMISSION_STATUS_LABEL[s.status],
        Recruiter: s.recruiter?.name || s.recruiterName || "Direct",
        "Recruiter email": s.recruiter?.email || "",
        Submitted: s.createdAt ?? "",
        Notes: s.notes,
      })),
    );
  }

  async function onDelete() {
    if (!job) return;
    const warning = subs.length
      ? `Delete “${job.title}”?\n\nThis role has ${subs.length} candidate submission${subs.length === 1 ? "" : "s"}, which will be deleted with it. This cannot be undone.`
      : `Delete “${job.title}”? This cannot be undone.`;
    if (!confirm(warning)) return;

    setDeleting(true);
    try {
      await deleteJob(job.id);
      router.replace(adminRoutes.jobs);
    } catch (err) {
      alert(errorMessage(err, "Could not delete the job."));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
        <Loader />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div>
        <BackLink />
        <LoadError what="this role" message={error ?? "Job not found."} onRetry={load} />
      </div>
    );
  }

  const open = subs.find((s) => s.id === openId) ?? null;
  const pay = payLabel(job);

  return (
    <div>
      <BackLink />

      {/* header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle[job.status]}`}>
              {job.status}
            </span>
            <span className="rounded-pill bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">
              {job.category}
            </span>
            <span className="rounded-pill bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">
              {job.employmentType}
            </span>
            {job.remote && (
              <span className="rounded-pill bg-lime/30 px-2.5 py-0.5 text-xs font-semibold text-ink">
                Remote
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            {job.title}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {job.company}
            {job.location ? ` · ${job.location}` : ""} · posted {formatDate(job.createdAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {job.status === "open" && (
            /* The live page, so the posting can be checked as applicants see
               it. Only shown for open roles — /jobs/[id] serves nothing else. */
            <Link
              href={`/jobs/${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-pill border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
            >
              View live
            </Link>
          )}
          <Link
            href={adminRoutes.editJob(job.id)}
            className="rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Edit role
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-pill border border-coral/40 px-4 py-2 text-sm font-semibold text-coral hover:bg-coral-soft disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* facts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Compensation" value={pay} />
        <Stat label="Referral bounty" value={job.bounty ? money(job.bounty) : "—"} />
        <Stat label="Submissions" value={String(subs.length)} />
        <Stat
          label="Hired"
          value={String(subs.filter((s) => s.status === "hired").length)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* the posting */}
        <div className="rounded-2xl border border-line bg-white p-6">
          <Prose title="About the role" text={job.description} />
          <Prose title="Responsibilities" text={job.responsibilities} />
          <Prose title="Requirements and skills" text={job.requirements} />

          <List title="Hiring process" items={job.hiringStages.filter(Boolean)} ordered />
          <List title="Screening questions" items={job.screeningQuestions.filter(Boolean)} />

          {job.faqs.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-ink">FAQs</h2>
              <div className="mt-2 space-y-2">
                {job.faqs.map((f, i) => (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <p className="text-sm font-semibold text-ink">{f.question}</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted">
                      {f.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* candidates */}
        <div className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-5 py-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-ink">Candidates</h2>
              <p className="mt-0.5 text-sm text-muted">Referred for this role.</p>
            </div>
            {subs.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="shrink-0 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
              >
                Export CSV
              </button>
            )}
          </div>
          {subs.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No candidates submitted yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {subs.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(s.id)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-sm font-semibold text-ink hover:text-primary">
                      {s.candidateName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      via {s.recruiter?.name || s.recruiterName || "direct"} ·{" "}
                      {formatDate(s.createdAt)}
                    </p>
                  </button>
                  <select
                    value={s.status}
                    onChange={(e) => changeStatus(s, e.target.value as SubmissionStatus)}
                    className="input mt-2 h-8 w-auto py-0 text-xs"
                    aria-label={`Status for ${s.candidateName}`}
                  >
                    {(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {SUBMISSION_STATUS_LABEL[st]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {open && (
        <SubmissionDetail
          submission={open}
          onClose={() => setOpenId(null)}
          onStatusChange={(status) => changeStatus(open, status)}
        />
      )}
    </div>
  );
}

/** "$120,000 – $150,000", or one end of it, or "Not specified". */
function payLabel(job: Job): string {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
  if (job.salaryMin) return `From ${fmt(job.salaryMin)}`;
  if (job.salaryMax) return `Up to ${fmt(job.salaryMax)}`;
  return "Not specified";
}

function BackLink() {
  return (
    <Link
      href={adminRoutes.jobs}
      className="mb-4 inline-block text-sm font-semibold text-muted hover:text-ink"
    >
      ← All jobs
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-lg font-extrabold tracking-tight text-ink">{value}</p>
    </div>
  );
}

function Prose({ title, text }: { title: string; text: string }) {
  if (!text?.trim()) return null;
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-muted">{text}</p>
    </section>
  );
}

function List({
  title,
  items,
  ordered,
}: {
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={item + i} className="flex gap-2.5 text-sm text-muted">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
              {ordered ? i + 1 : "•"}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
