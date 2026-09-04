"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  listAllUsers, setRecruiterMetroTeamMember, setRecruiterVerified, setRecruiterSuspended,
  setRecruiterSiteBuilderEnabled, sendProfileReminder, type UserProfile,
} from "@/lib/users";
import { profileCompletion } from "@/lib/profileCompletion";
import { RecruiterEmailComposer } from "@/components/admin/RecruiterEmailComposer";
import { getRecruiterSiteForAdmin, type RecruiterSite } from "@/lib/recruiterSite";
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
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { SubmissionDetail } from "@/components/admin/SubmissionDetail";
import { adminRoutes } from "@/lib/routes";
import { formatDate, timeAgo } from "@/lib/dates";
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
  const [site, setSite] = useState<RecruiterSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [togglingMetro, setTogglingMetro] = useState(false);
  const [togglingVerified, setTogglingVerified] = useState(false);
  const [togglingSuspended, setTogglingSuspended] = useState(false);
  const [togglingSiteBuilder, setTogglingSiteBuilder] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  /* Success and failure are tracked apart rather than as one notice string.
     A successful send is already visible in the "last reminded" line below —
     it flips to "just now" — so it only needs a tone change there, not a
     second sentence repeating the same fact. A failure has nowhere else to
     show, so it keeps a line of its own. */
  const [justSent, setJustSent] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, all, recruiterSite] = await Promise.all([
        listAllUsers(), listAllSubmissions(), getRecruiterSiteForAdmin(uid).catch(() => null),
      ]);
      const found = users.find((u) => u.uid === uid) ?? null;
      setUser(found);
      setNotFound(!found);
      setSubs(all.filter((s) => s.recruiterId === uid));
      setSite(recruiterSite);
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

  /* Every action below changes what this recruiter is allowed to do, so each
     one goes through the same confirm step — including the grants, which used
     to apply on a single click with nothing to catch a misclick on the wrong
     recruiter's page. */
  const { confirm, dialog } = useConfirm();

  /* Optimistic, with rollback on failure — same pattern as changeStatus
     above. This is the one field on a recruiter the console can write. */
  async function toggleMetroTeam() {
    if (!user) return;
    const next = !user.metroTeamMember;
    const who = user.name || "this recruiter";
    if (
      !(await confirm(
        next
          ? {
              title: "Mark as Metro Associates team?",
              message: `${who} will be treated as internal Metro staff rather than an external recruiter.`,
              note: "Internal team members are handled differently across the platform.",
              confirmLabel: "Mark as team",
            }
          : {
              title: "Remove Metro Associates team status?",
              message: `${who} will be treated as an external recruiter again.`,
              tone: "danger",
              confirmLabel: "Remove status",
            },
      ))
    ) {
      return;
    }
    setUser({ ...user, metroTeamMember: next });
    setTogglingMetro(true);
    try {
      await setRecruiterMetroTeamMember(user.uid, next);
    } catch {
      setUser((u) => (u ? { ...u, metroTeamMember: !next } : u));
      alert("Could not update Metro Associates team status.");
    } finally {
      setTogglingMetro(false);
    }
  }

  async function toggleVerified() {
    if (!user) return;
    const next = !user.verified;
    const who = user.name || "this recruiter";
    /* Verifying is the one grant that says "we know who this person is", and
       the video is the only evidence we ask for — so if there isn't one on
       file, say so here rather than letting it be ticked unknowingly. */
    const noVideo = !user.verificationVideoUrl;
    if (
      !(await confirm(
        next
          ? {
              title: `Verify ${who}?`,
              message: "They'll be able to submit candidates against live roles.",
              note: noVideo
                ? "No verification video on file. You're vouching for them without one."
                : undefined,
              confirmLabel: "Verify recruiter",
            }
          : {
              title: `Un-verify ${who}?`,
              message: "They won't be able to submit new candidates until re-verified.",
              tone: "danger",
              confirmLabel: "Un-verify",
            },
      ))
    ) {
      return;
    }
    setUser({ ...user, verified: next });
    setTogglingVerified(true);
    try {
      await setRecruiterVerified(user.uid, next);
    } catch {
      setUser((u) => (u ? { ...u, verified: !next } : u));
      alert("Could not update verification status.");
    } finally {
      setTogglingVerified(false);
    }
  }

  async function toggleSuspended() {
    if (!user) return;
    const next = !user.suspended;
    const who = user.name || "this recruiter";
    if (
      !(await confirm(
        next
          ? {
              title: `Suspend ${who}?`,
              message:
                "They'll be blocked from submitting candidates, saving candidates, sending messages and uploading files.",
              note: "They can still sign in and see their dashboard.",
              tone: "danger",
              confirmLabel: "Suspend",
            }
          : {
              title: `Reinstate ${who}?`,
              message: "They'll be able to act on the platform again.",
              confirmLabel: "Reinstate",
            },
      ))
    ) {
      return;
    }
    setUser({ ...user, suspended: next });
    setTogglingSuspended(true);
    try {
      await setRecruiterSuspended(user.uid, next);
    } catch {
      setUser((u) => (u ? { ...u, suspended: !next } : u));
      alert("Could not update suspension status.");
    } finally {
      setTogglingSuspended(false);
    }
  }

  async function toggleSiteBuilder() {
    if (!user) return;
    const next = !user.siteBuilderEnabled;
    const who = user.name || "this recruiter";
    if (
      !(await confirm(
        next
          ? {
              title: "Unlock the website builder?",
              message: `${who} will be able to build and publish their own public recruiter site.`,
              note: "This perk is normally granted after a first placement.",
              confirmLabel: "Unlock builder",
            }
          : {
              title: "Lock the website builder?",
              message: `${who} will lose access to the builder.`,
              note: "Any site they've already published stays live.",
              tone: "danger",
              confirmLabel: "Lock builder",
            },
      ))
    ) {
      return;
    }
    setUser({ ...user, siteBuilderEnabled: next });
    setTogglingSiteBuilder(true);
    try {
      await setRecruiterSiteBuilderEnabled(user.uid, next);
    } catch {
      setUser((u) => (u ? { ...u, siteBuilderEnabled: !next } : u));
      alert("Could not update the website builder access.");
    } finally {
      setTogglingSiteBuilder(false);
    }
  }

  async function remindProfile() {
    setEmailSent(null);
    if (!user) return;
    setReminderError(null);
    setSendingReminder(true);
    try {
      await sendProfileReminder(user.uid);
      const now = new Date().toISOString();
      setUser({ ...user, profileReminderSentAt: now });
      setJustSent(true);
    } catch (err) {
      setJustSent(false);
      setReminderError(
        err instanceof Error && err.message ? err.message : "Could not send the reminder.",
      );
    } finally {
      setSendingReminder(false);
    }
  }

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
  const completion = profileCompletion(user);

  return (
    <div>
      {dialog}
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                    {user.name || "Unnamed recruiter"}
                  </h1>
                  <span
                    className={`inline-flex rounded-pill px-2 py-0.5 text-[11px] font-semibold ${
                      user.verified ? "bg-sage-soft text-ink" : "bg-coral-soft text-coral"
                    }`}
                  >
                    {user.verified ? "Verified" : "Pending verification"}
                  </span>
                  {user.suspended && (
                    <span className="inline-flex rounded-pill bg-coral px-2 py-0.5 text-[11px] font-semibold text-white">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {user.headline || "Recruiter"}
                  {user.company ? ` · ${user.company}` : ""}
                </p>
              </div>
            </div>

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

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Verification video
          </p>
          {user.verificationVideoUrl ? (
            // Fresh signed URL from this page load — the video element's own
            // fetch happens right away, well inside the link's 1-hour TTL.
            <video controls src={user.verificationVideoUrl} className="mt-2 h-44 rounded-xl bg-ink" />
          ) : (
            <p className="mt-1.5 text-sm text-muted">
              No video submitted yet — nothing to review before verifying.
            </p>
          )}
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">
            Account controls
          </p>
          <div className="mt-1 divide-y divide-line">
            <ToggleRow
              label="Verified"
              description="Lets them submit candidates to open roles."
              on={user.verified}
              onToggle={toggleVerified}
              disabled={togglingVerified}
            />
            <ToggleRow
              label="Metro Associates team"
              description="Shown on Metro Associates' public Meet Our Team page."
              on={user.metroTeamMember}
              onToggle={toggleMetroTeam}
              disabled={togglingMetro}
            />
            <ToggleRow
              label="Website builder"
              description={
                site?.published ? (
                  <>
                    Live at{" "}
                    <Link
                      href={`/sites/${site.slug}`}
                      target="_blank"
                      className="font-semibold text-primary hover:underline"
                    >
                      jobfolder.com/sites/{site.slug}
                    </Link>
                  </>
                ) : site ? (
                  "Draft saved, not published yet."
                ) : user.siteBuilderEnabled ? (
                  "Unlocked — hasn't started building yet."
                ) : (
                  "Free recruiter-website builder, hosted at jobfolder.com/sites/…"
                )
              }
              on={user.siteBuilderEnabled}
              onToggle={toggleSiteBuilder}
              disabled={togglingSiteBuilder}
            />
            <ToggleRow
              label="Suspended"
              description="Blocks submissions, saved candidates, messages, and file uploads."
              on={user.suspended}
              onToggle={toggleSuspended}
              disabled={togglingSuspended}
              tone="danger"
            />
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Profile completion
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="h-2 w-40 overflow-hidden rounded-pill bg-cream">
                  <div
                    className={`h-full rounded-pill ${completion.percent < 50 ? "bg-coral" : completion.isComplete ? "bg-sage" : "bg-lime"}`}
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-ink">{completion.percent}%</span>
              </div>
              {!completion.isComplete && (
                <p className="mt-1.5 text-xs text-muted">
                  Missing: {completion.missing.map((f) => f.label).join(", ")}
                </p>
              )}
              {/* One line, not three: when it went, the exact date, and who it
                  reached. "2 days ago" is the part an admin actually reads —
                  it answers "is it too soon to nudge again?" without doing
                  date arithmetic — so it leads, with the calendar date kept
                  alongside for the record. */}
              {user.profileReminderSentAt && (
                <p
                  className={`mt-2 inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-pill px-2.5 py-1 text-[11px] ${
                    justSent ? "bg-sage-soft text-ink" : "bg-cream text-muted"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M3 5h14v10H3zM3 6l7 5 7-5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                  <span className="font-semibold text-ink">
                    {justSent ? "Reminder sent" : `Reminded ${timeAgo(user.profileReminderSentAt)}`}
                  </span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>{formatDate(user.profileReminderSentAt)}</span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span className="truncate">{user.email}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
            {!completion.isComplete && (
              <button
                type="button"
                onClick={remindProfile}
                disabled={sendingReminder}
                className="shrink-0 rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary disabled:opacity-60"
                title="Emails this recruiter a reminder to finish their profile"
              >
                {sendingReminder
                  ? "Sending…"
                  : user.profileReminderSentAt
                    ? "Send reminder again"
                    : "Send profile reminder"}
              </button>
            )}
            <RecruiterEmailComposer
              uid={user.uid}
              recruiterName={user.name}
              recruiterEmail={user.email}
              onSent={(subject) => setEmailSent(subject)}
            />
            </div>
          </div>
          {emailSent && (
            <p className="mt-2.5 text-xs font-semibold text-primary">
              Email sent — &ldquo;{emailSent}&rdquo;
            </p>
          )}
          {reminderError && (
            <p className="mt-2.5 text-xs text-coral">{reminderError}</p>
          )}
        </div>
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

/** One row of the "Account controls" table — a labeled setting with its
    current state as a switch, replacing what used to be a row of pill
    buttons that overflowed the card on narrower screens. */
function ToggleRow({
  label, description, on, onToggle, disabled, tone = "primary",
}: {
  label: string;
  description: React.ReactNode;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors disabled:opacity-60 ${
          on ? (tone === "danger" ? "bg-coral" : "bg-primary") : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
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
