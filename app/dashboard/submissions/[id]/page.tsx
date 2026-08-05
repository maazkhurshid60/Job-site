"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { listSubmissionsByRecruiter, type Submission } from "@/lib/submissions";
import { SubmissionBadge, money } from "@/components/dashboard/parts";
import { CvPreview, canPreview } from "@/components/admin/CvPreview";
import { Loader } from "@/components/Loader";
import { formatDate } from "@/lib/dates";

/* One of the recruiter's own candidates, in full.

   Reads the existing /api/submissions rather than adding a per-id endpoint:
   that route already derives the recruiter from the verified token, so it can
   only ever return this recruiter's own rows — a submission belonging to
   someone else simply is not in the response, and the page 404s. A new
   /api/submissions/[id] would mean another place that has to get that
   ownership check right. The payload also re-mints the one-hour signed CV
   link on every read, so arriving here fresh always gets a working URL. */

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    listSubmissionsByRecruiter()
      .then((all) => setSub(all.find((s) => s.id === id) ?? null))
      .catch(() => setError("Could not load this submission."))
      .finally(() => setLoading(false));
  }, [user, authLoading, id]);

  if (loading) {
    return (
      <div className="grid h-60 place-items-center rounded-2xl border border-line bg-white">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <BackLink />
        <p className="rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>
      </div>
    );
  }

  if (!sub) {
    return (
      <div>
        <BackLink />
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">Submission not found</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            It may have been removed, or it belongs to another recruiter.
          </p>
          <Link
            href="/dashboard/submissions"
            className="mt-5 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Back to my submissions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {sub.candidateName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Submitted {formatDate(sub.createdAt)} for{" "}
            <Link href={`/jobs/${sub.jobId}`} className="font-medium text-ink hover:text-primary">
              {sub.jobTitle}
            </Link>
            {sub.company ? ` · ${sub.company}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SubmissionBadge status={sub.status} />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* candidate + bounty */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Candidate</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Name" value={sub.candidateName} />
              <Row
                label="Email"
                value={
                  <a href={`mailto:${sub.candidateEmail}`} className="text-ink hover:text-primary">
                    {sub.candidateEmail}
                  </a>
                }
              />
              <Row
                label="Phone"
                value={
                  <a href={`tel:${sub.candidatePhone}`} className="text-ink hover:text-primary">
                    {sub.candidatePhone}
                  </a>
                }
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Bounty</h2>
            <p className="mt-2 text-2xl font-extrabold text-ink">{money(sub.bounty)}</p>
            <p className="mt-1 text-xs text-muted">
              {sub.status === "hired"
                ? "This placement has been marked hired."
                : "Paid once this candidate is hired and clears the guarantee period."}
            </p>
          </section>

          {sub.notes && (
            <section className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Your notes</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{sub.notes}</p>
            </section>
          )}
        </div>

        {/* CV */}
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">CV</h2>
            {sub.cvUrl && (
              <a
                href={sub.cvUrl}
                className="rounded-pill border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-cream"
              >
                Download{sub.cvName ? ` · ${sub.cvName}` : ""}
              </a>
            )}
          </div>

          {!sub.cvUrl ? (
            <p className="mt-4 text-sm text-muted">No CV was attached to this submission.</p>
          ) : canPreview(sub.cvType) ? (
            <div className="mt-4">
              <CvPreview url={sub.cvUrl} contentType={sub.cvType} filename={sub.cvName} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              This file type can&apos;t be previewed here — use the download link above.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/submissions"
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
    >
      <span aria-hidden>←</span> My submissions
    </Link>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
