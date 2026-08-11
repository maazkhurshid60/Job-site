"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listSubmissionsByRecruiter,
  type Submission,
} from "@/lib/submissions";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { feeTierAmount } from "@/lib/feeTiers";
import {
  StatCard, SubmissionBadge, ProfileMeter, money,
} from "@/components/dashboard/parts";
import { profileCompletion } from "@/lib/profileCompletion";
import {
  SubmissionsOverTime,
  PipelineByStage,
  OutcomesDonut,
} from "@/components/dashboard/Charts";
import { Loader } from "@/components/Loader";

export default function DashboardOverview() {
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([listSubmissionsByRecruiter(), listOpenJobs()])
      .then(([s, jobs]) => {
        setSubs(s);
        setOpenJobs(jobs);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = profile?.name?.split(" ")[0] || "there";
  const completion = profileCompletion(profile);
  const hired = subs.filter((s) => s.status === "hired");
  const active = subs.filter(
    (s) => s.status !== "hired" && s.status !== "rejected",
  );
  const interviewing = subs.filter((s) => s.status === "client_review");

  // Fee-tier amounts, never bounty — this is the recruiter's own dashboard,
  // it must show what they actually earn, not what the client pays JobFolder.
  const earned = hired.reduce((sum, s) => sum + (feeTierAmount(s.feeTier) ?? 0), 0);
  const pending = interviewing.reduce(
    (sum, s) => sum + (feeTierAmount(s.feeTier) ?? 0),
    0,
  );
  const potential = active.reduce(
    (sum, s) => sum + (feeTierAmount(s.feeTier) ?? 0),
    0,
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">Your workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
            Welcome, {firstName}
          </h1>
        </div>
        <Link
          href="/jobs"
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Browse jobs
        </Link>
      </div>

      {!completion.isComplete && (
        <div className="mb-6 rounded-2xl border border-line bg-cream/50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">
                Your profile is {completion.percent}% complete
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {completion.filled} of {completion.total} details added — it&apos;s
                how our recruiters know who they&apos;re working with on your
                referrals.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="shrink-0 rounded-pill border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-primary hover:text-primary"
            >
              Complete profile
            </Link>
          </div>

          <ProfileMeter percent={completion.percent} className="mt-4" />

          <p className="mt-3 text-xs text-muted">
            <span className="font-semibold text-ink">Still to add:</span>{" "}
            {/* Only the first few — a list of eight reads as a chore, not a nudge. */}
            {completion.missing.slice(0, 4).map((f) => f.label).join(", ")}
            {completion.missing.length > 4 &&
              ` and ${completion.missing.length - 4} more`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            My activity
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Open positions" value={openJobs.length} />
            <StatCard label="Candidates submitted" value={subs.length} />
            <StatCard label="Candidates interviewing" value={interviewing.length} />
            <StatCard label="Placements" value={hired.length} />
          </div>

          <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-muted">
            Earnings
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Earned"
              value={money(earned)}
              hint="Recruiter fee on confirmed placements"
            />
            <StatCard
              label="Pending"
              value={money(pending)}
              hint="Candidates with the client now"
            />
            <StatCard
              label="Potential from active candidates"
              value={money(potential)}
              hint="Every candidate still in your pipeline"
            />
          </div>

          {/* charts */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <SubmissionsOverTime subs={subs} />
            <OutcomesDonut subs={subs} />
          </div>
          <div className="mt-4">
            <PipelineByStage subs={subs} />
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-white p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-bold text-ink">Your candidates</h2>
              {subs.length > 8 && (
                <Link
                  href="/dashboard/submissions"
                  className="text-sm font-semibold text-primary hover:text-primary-dark"
                >
                  View all →
                </Link>
              )}
            </div>
            {subs.length === 0 ? (
              <div>
                <p className="text-sm text-muted">
                  You haven&apos;t submitted any candidates yet.
                </p>
                <Link
                  href="/jobs"
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
                >
                  Browse open jobs →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-4 font-semibold">Candidate</th>
                      <th className="py-2 pr-4 font-semibold">Position</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 pr-4 font-semibold">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {subs.slice(0, 8).map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/dashboard/submissions/${s.id}`}
                            className="font-semibold text-ink hover:text-primary"
                          >
                            {s.candidateName}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-muted">{s.jobTitle}</td>
                        <td className="py-3 pr-4">
                          <SubmissionBadge status={s.status} />
                        </td>
                        <td className="py-3 pr-4 font-semibold text-ink">
                          {money(feeTierAmount(s.feeTier))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
