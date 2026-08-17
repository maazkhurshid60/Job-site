"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listJobs, type Job } from "@/lib/jobs";
import {
  listAllSubmissions, SUBMISSION_STATUS_LABEL, type Submission,
} from "@/lib/submissions";
import { listAllUsers, type UserProfile } from "@/lib/users";
import { adminRoutes } from "@/lib/routes";
import { StatCard, SubmissionBadge } from "@/components/dashboard/parts";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listJobs(), listAllSubmissions(), listAllUsers()])
      .then(([j, s, u]) => {
        setJobs(j);
        setSubs(s);
        setUsers(u);
      })
      .catch((err) =>
        setError(errorMessage(err, "The server didn't respond. Please try again.")),
      )
      .finally(() => setLoading(false));
  }, []);

  const open = jobs.filter((j) => j.status === "open").length;
  const draft = jobs.filter((j) => j.status === "draft").length;
  const inScreening = subs.filter(
    (s) => s.status === "submitted" || s.status === "screening",
  ).length;
  const hired = subs.filter((s) => s.status === "hired").length;

  const jobCounts = countBy(jobs);
  const subCounts = countBy(subs);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">Overview</p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">
            Dashboard
          </h1>
        </div>
        <Link
          href={adminRoutes.newJob}
          className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          Post a job
        </Link>
      </div>

      {error && (
        <LoadError
          what="the dashboard"
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total jobs" value={jobs.length} hint={`${open} open · ${draft} draft`} />
            <StatCard label="Recruiters" value={users.length} />
            <StatCard label="Submissions" value={subs.length} hint={`${inScreening} need screening`} />
            <StatCard label="Hired" value={hired} />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <StatusBreakdown
              title="Jobs by status"
              counts={jobCounts}
              order={["open", "draft", "closed"]}
              labels={{ open: "Open", draft: "Draft", closed: "Closed" }}
              tones={{ open: "#1e9e63", draft: "#a8a29a", closed: "#ee5b3f" }}
            />
            <StatusBreakdown
              title="Submissions by status"
              counts={subCounts}
              order={["submitted", "screening", "approved", "client_review", "hired", "rejected"]}
              labels={SUBMISSION_STATUS_LABEL}
              tones={{
                submitted: "#a8a29a", screening: "#c2820a", approved: "#3fb27f",
                client_review: "#1e9e63", hired: "#16814f", rejected: "#ee5b3f",
              }}
            />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* recent jobs */}
            <Panel title="Recent jobs" href={adminRoutes.jobs} linkLabel="All jobs">
              {jobs.length === 0 ? (
                <Empty text="No jobs yet." cta={{ href: adminRoutes.newJob, label: "Post your first job" }} />
              ) : (
                <ul className="divide-y divide-line">
                  {jobs.slice(0, 5).map((j) => (
                    <li key={j.id} className="flex items-center justify-between py-2.5">
                      <Link href={adminRoutes.editJob(j.id)} className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink hover:text-primary">{j.title}</p>
                        <p className="truncate text-[11px] text-muted">{j.company} · {j.category}</p>
                      </Link>
                      <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        j.status === "open" ? "bg-primary-soft text-primary" : j.status === "draft" ? "bg-line text-muted" : "bg-coral-soft text-coral"
                      }`}>{j.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* recent submissions */}
            <Panel title="Recent submissions" href={adminRoutes.submissions} linkLabel="All submissions">
              {subs.length === 0 ? (
                <Empty text="No candidate submissions yet." />
              ) : (
                <ul className="divide-y divide-line">
                  {subs.slice(0, 5).map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">{s.candidateName}</p>
                        <p className="truncate text-[11px] text-muted">{s.jobTitle}</p>
                      </div>
                      <SubmissionBadge status={s.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* recent recruiters */}
          <div className="mt-3">
            <Panel title="Recent recruiters" href={adminRoutes.recruiters} linkLabel="All recruiters">
              {users.length === 0 ? (
                <Empty text="No recruiters have signed up yet." />
              ) : (
                <ul className="divide-y divide-line">
                  {users.slice(0, 5).map((u) => (
                    <li key={u.uid} className="flex items-center gap-2.5 py-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-xs font-bold text-primary">
                        {u.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.photoURL} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          (u.name || u.email || "R").charAt(0).toUpperCase()
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">{u.name || "Unnamed"}</p>
                        <p className="truncate text-[11px] text-muted">{u.company || u.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        <Link href={href} className="text-xs font-semibold text-primary hover:text-primary-dark">{linkLabel} →</Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="py-3">
      <p className="text-xs text-muted">{text}</p>
      {cta && <Link href={cta.href} className="mt-1.5 inline-block text-xs font-semibold text-primary">{cta.label} →</Link>}
    </div>
  );
}

/** Horizontal-bar breakdown of a status field — jobs by status, submissions
    by status. Statuses with zero count are still listed (at zero width), so
    the shape of the pipeline stays visible even when a stage is empty. */
function StatusBreakdown<T extends string>({
  title, counts, order, labels, tones,
}: {
  title: string;
  counts: Record<string, number>;
  order: T[];
  labels: Record<T, string>;
  tones: Record<T, string>;
}) {
  const total = order.reduce((sum, k) => sum + (counts[k] ?? 0), 0);
  const max = Math.max(1, ...order.map((k) => counts[k] ?? 0));
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <h2 className="mb-2.5 text-sm font-bold text-ink">{title}</h2>
      {total === 0 ? (
        <p className="text-xs text-muted">Nothing to show yet.</p>
      ) : (
        <div className="space-y-2">
          {order.map((k) => {
            const value = counts[k] ?? 0;
            return (
              <div key={k}>
                <div className="mb-0.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-ink">{labels[k]}</span>
                  <span className="text-muted">{value}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(value / max) * 100}%`, background: tones[k] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function countBy<T extends string>(items: { status: T }[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item.status] = (map[item.status] ?? 0) + 1;
  }
  return map;
}
