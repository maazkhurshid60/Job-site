"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { listAllUsers, type UserProfile } from "@/lib/users";
import {
  listAllSubmissions,
  setSubmissionStatus,
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import { money } from "@/components/dashboard/parts";
import { feeTierAmount } from "@/lib/feeTiers";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { SubmissionDetail } from "@/components/admin/SubmissionDetail";
import { adminRoutes } from "@/lib/routes";
import { formatDate } from "@/lib/dates";
import { SocialLinkList } from "@/components/SocialLinks";

/* One recruiter, in full: their profile as they filled it in, and every
   candidate they have referred.

   Both lists come from the existing admin endpoints rather than a new
   /api/admin/recruiters/[uid]. The console already loads them on the list page,
   the row counts are small, and every extra admin endpoint is another surface
   that has to get requireAdmin() right. */

export default function RecruiterDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, all] = await Promise.all([listAllUsers(), listAllSubmissions()]);
      const found = users.find((u) => u.uid === uid) ?? null;
      setUser(found);
      setNotFound(!found);
      setSubs(all.filter((s) => s.recruiterId === uid));
    } catch (err) {
      setError(errorMessage(err, "The server didn't respond. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [uid]);

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

  const stats = useMemo(() => {
    const hired = subs.filter((s) => s.status === "hired");
    return {
      total: subs.length,
      interviewing: subs.filter((s) => s.status === "client_review").length,
      active: subs.filter((s) => s.status !== "hired" && s.status !== "rejected").length,
      hired: hired.length,
      // What this recruiter has earned — the fee tier on confirmed hires, not
      // bounty. Bounty is what the client pays JobFolder, a separate figure
      // this recruiter never sees, even in their own admin record.
      earned: hired.reduce((sum, s) => sum + (feeTierAmount(s.feeTier) ?? 0), 0),
    };
  }, [subs]);

  const open = subs.find((s) => s.id === openId) ?? null;

  if (loading) {
    return (
      <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <BackLink />
        <LoadError what="this recruiter" message={error} onRetry={load} />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div>
        <BackLink />
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h1 className="font-bold text-ink">Recruiter not found</h1>
          <p className="mt-1 text-sm text-muted">
            This account may have been deleted since the list was loaded.
          </p>
        </div>
      </div>
    );
  }

  const initial = (user.name || user.email || "R").charAt(0).toUpperCase();

  return (
    <div>
      <BackLink />

      {/* identity */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-2xl font-bold text-primary">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              {user.name || "Unnamed recruiter"}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {user.headline || "Recruiter"}
              {user.company ? ` · ${user.company}` : ""}
            </p>
            <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <Row label="Email" value={user.email} href={`mailto:${user.email}`} />
              <Row label="Phone" value={user.phone} href={`tel:${user.phone}`} />
              <Row label="Location" value={user.location} />
              <Row label="Joined" value={formatDate(user.createdAt)} />
              {/* The Firebase UID — the join key for every table. Worth showing
                  when reconciling a submission against an account by hand. */}
              <Row label="Account ID" value={user.uid} mono />
            </dl>
            <SocialLinkList links={user} className="mt-4" />
          </div>
        </div>

        {user.bio && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">About</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-muted">
              {user.bio}
            </p>
          </div>
        )}
      </div>

      {/* stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Candidates submitted" value={String(stats.total)} />
        <Stat label="Interviewing" value={String(stats.interviewing)} />
        <Stat label="In progress" value={String(stats.active)} />
        <Stat label="Hired" value={String(stats.hired)} />
        <Stat label="Earned" value={money(stats.earned)} hint="Recruiter fee on hires" />
      </div>

      {/* their candidates */}
      <div className="mt-6 rounded-2xl border border-line bg-white">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-bold text-ink">Candidates referred</h2>
          <p className="mt-0.5 text-sm text-muted">
            Open one to read the CV and change its status.
          </p>
        </div>

        {subs.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            This recruiter hasn&apos;t referred anyone yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {subs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setOpenId(s.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-semibold text-ink hover:text-primary">
                    {s.candidateName}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {s.jobTitle}
                    {s.company ? ` · ${s.company}` : ""} · {formatDate(s.createdAt)}
                  </p>
                </button>
                <span className="shrink-0 text-sm text-muted">
                  {money(feeTierAmount(s.feeTier))}
                </span>
                <select
                  value={s.status}
                  onChange={(e) => changeStatus(s, e.target.value as SubmissionStatus)}
                  className="input h-9 w-auto shrink-0 py-0 text-xs"
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

function BackLink() {
  return (
    <Link
      href={adminRoutes.recruiters}
      className="mb-4 inline-block text-sm font-semibold text-muted hover:text-ink"
    >
      ← All recruiters
    </Link>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  href,
  external,
  mono,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  mono?: boolean;
}) {
  // A profile field the recruiter never filled in says nothing worth a row.
  if (!value) return null;
  return (
    <div className="flex gap-3 text-sm">
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className={`min-w-0 break-words ${mono ? "font-mono text-xs text-muted" : "font-medium text-ink"}`}>
        {href ? (
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
