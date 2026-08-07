"use client";

import { useEffect } from "react";
import {
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
  SUBMISSION_STATUSES,
} from "@/lib/submissions";
import { money } from "@/components/dashboard/parts";
import { formatDate } from "@/lib/dates";
import { CvPreview } from "./CvPreview";
import { SocialLinkList } from "@/components/SocialLinks";

/* Full detail for one submission: the candidate, the CV itself, and the
   recruiter who referred them — the three things needed to screen someone
   without leaving the page. */

export function SubmissionDetail({
  submission: s,
  onClose,
  onStatusChange,
}: {
  submission: Submission;
  onClose: () => void;
  onStatusChange: (status: SubmissionStatus) => void;
}) {
  // Escape closes. Expected of anything that covers the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const r = s.recruiter;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 bg-ink/40 backdrop-blur-[2px]"
      />

      <aside className="flex h-full w-full max-w-5xl flex-col bg-cream shadow-2xl">
        {/* header */}
        <header className="flex items-start justify-between gap-4 border-b border-line bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-ink">
              {s.candidateName}
            </h2>
            <p className="truncate text-sm text-muted">
              {s.jobTitle}
              {s.company ? ` · ${s.company}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={s.status}
              onChange={(e) => onStatusChange(e.target.value as SubmissionStatus)}
              className="input h-9 w-auto py-0 text-sm"
              aria-label="Submission status"
            >
              {SUBMISSION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {SUBMISSION_STATUS_LABEL[st]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-black/5 hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_360px]">
          {/* CV */}
          <div className="min-h-0 p-5">
            {s.cvUrl ? (
              <div className="flex h-full min-h-[26rem] flex-col">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink">
                    {s.cvName || "CV"}
                    {s.cvSize !== null && (
                      <span className="ml-2 font-normal text-muted">
                        {Math.max(1, Math.round(s.cvSize / 1024))} KB
                      </span>
                    )}
                  </p>
                  <a
                    href={s.cvUrl}
                    className="rounded-pill border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
                  >
                    Download
                  </a>
                </div>
                <div className="min-h-0 flex-1">
                  <CvPreview
                    url={s.cvUrl}
                    contentType={s.cvType}
                    filename={s.cvName || "CV"}
                  />
                </div>
              </div>
            ) : (
              <div className="grid h-full min-h-[20rem] place-items-center rounded-xl border border-dashed border-line bg-white">
                <p className="text-sm text-muted">
                  No CV was attached to this submission.
                </p>
              </div>
            )}
          </div>

          {/* details */}
          <div className="min-h-0 overflow-y-auto border-line bg-white p-5 lg:border-l">
            <Section title="Candidate">
              <Row label="Name" value={s.candidateName} />
              <Row label="Email" value={s.candidateEmail} href={`mailto:${s.candidateEmail}`} />
              <Row label="Phone" value={s.candidatePhone} href={`tel:${s.candidatePhone}`} />
              <Row label="Submitted" value={formatDate(s.createdAt)} />
              <Row label="Bounty" value={s.bounty ? money(s.bounty) : "—"} />
            </Section>

            {s.notes && (
              <Section title="Why they're a fit">
                <p className="whitespace-pre-line text-sm leading-6 text-muted">
                  {s.notes}
                </p>
              </Section>
            )}

            <Section title="Referred by">
              {r ? (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary">
                      {r.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (r.name || r.email || "R").charAt(0).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">
                        {r.name || "Unnamed recruiter"}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {r.headline || "Recruiter"}
                      </p>
                    </div>
                  </div>
                  <Row label="Company" value={r.company} />
                  <Row label="Email" value={r.email} href={`mailto:${r.email}`} />
                  <Row label="Phone" value={r.phone} href={`tel:${r.phone}`} />
                  <Row label="Location" value={r.location} />
                  <Row label="Joined" value={formatDate(r.createdAt)} />
                  <SocialLinkList links={r} className="mt-3" />
                </>
              ) : (
                /* recruiter_id is NULL — either an open application, or the
                   account was deleted after the referral was made. The
                   submission keeps the name it was created with either way. */
                <p className="text-sm text-muted">
                  {s.recruiterName
                    ? `Recorded as “${s.recruiterName}”, but there is no recruiter account linked to this submission any more.`
                    : "Submitted directly, with no referring recruiter."}
                </p>
              )}
            </Section>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 border-b border-line pb-5 last:mb-0 last:border-0 last:pb-0">
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  // An empty row is noise — say nothing rather than "Phone: —" for every gap.
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-20 shrink-0 text-muted">{label}</span>
      {href ? (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="min-w-0 break-words font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="min-w-0 break-words font-medium text-ink">{value}</span>
      )}
    </div>
  );
}
