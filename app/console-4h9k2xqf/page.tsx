"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listJobs, type Job } from "@/lib/jobs";
import { listAllSubmissions, type Submission } from "@/lib/submissions";
import { adminRoutes } from "@/lib/routes";
import { StatCard, SubmissionBadge } from "@/components/dashboard/parts";
import { Loader } from "@/components/Loader";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listJobs(), listAllSubmissions()])
      .then(([j, s]) => {
        setJobs(j);
        setSubs(s);
      })
      .catch(() => setError("Could not load data. Check your Firestore rules."))
      .finally(() => setLoading(false));
  }, []);

  const open = jobs.filter((j) => j.status === "open").length;
  const draft = jobs.filter((j) => j.status === "draft").length;
  const inScreening = subs.filter(
    (s) => s.status === "submitted" || s.status === "screening",
  ).length;
  const hired = subs.filter((s) => s.status === "hired").length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">Overview</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            Dashboard
          </h1>
        </div>
        <Link
          href={adminRoutes.newJob}
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Post a job
        </Link>
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total jobs" value={jobs.length} hint={`${open} open · ${draft} draft`} />
            <StatCard label="Open roles" value={open} />
            <StatCard label="Submissions" value={subs.length} />
            <StatCard label="Needs screening" value={inScreening} hint={`${hired} hired`} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* recent jobs */}
            <Panel title="Recent jobs" href={adminRoutes.jobs} linkLabel="All jobs">
              {jobs.length === 0 ? (
                <Empty text="No jobs yet." cta={{ href: adminRoutes.newJob, label: "Post your first job" }} />
              ) : (
                <ul className="divide-y divide-line">
                  {jobs.slice(0, 5).map((j) => (
                    <li key={j.id} className="flex items-center justify-between py-3">
                      <Link href={adminRoutes.editJob(j.id)} className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink hover:text-primary">{j.title}</p>
                        <p className="truncate text-xs text-muted">{j.company} · {j.category}</p>
                      </Link>
                      <span className={`shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-semibold capitalize ${
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
                    <li key={s.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{s.candidateName}</p>
                        <p className="truncate text-xs text-muted">{s.jobTitle}</p>
                      </div>
                      <SubmissionBadge status={s.status} />
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
    <div className="rounded-2xl border border-line bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-ink">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-primary hover:text-primary-dark">{linkLabel} →</Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="py-4">
      <p className="text-sm text-muted">{text}</p>
      {cta && <Link href={cta.href} className="mt-2 inline-block text-sm font-semibold text-primary">{cta.label} →</Link>}
    </div>
  );
}
