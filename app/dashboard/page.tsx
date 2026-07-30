"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listSubmissionsByRecruiter,
  type Submission,
} from "@/lib/submissions";
import { StatCard, SubmissionBadge, money } from "@/components/dashboard/parts";
import {
  SubmissionsOverTime,
  PipelineByStage,
  OutcomesDonut,
} from "@/components/dashboard/Charts";
import { Loader } from "@/components/Loader";

export default function DashboardOverview() {
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listSubmissionsByRecruiter()
      .then(setSubs)
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = profile?.name?.split(" ")[0] || "there";
  const hired = subs.filter((s) => s.status === "hired");
  const active = subs.filter(
    (s) => s.status !== "hired" && s.status !== "rejected",
  );
  const earnings = hired.reduce((sum, s) => sum + (s.bounty ?? 0), 0);

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

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Submissions" value={subs.length} />
            <StatCard label="In progress" value={active.length} />
            <StatCard label="Hired" value={hired.length} />
            <StatCard
              label="Earned"
              value={money(earnings)}
              hint="Bounties on hires"
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
            <h2 className="mb-4 font-bold text-ink">Recent submissions</h2>
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
              <ul className="divide-y divide-line">
                {subs.slice(0, 6).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {s.candidateName}
                      </p>
                      <p className="text-xs text-muted">{s.jobTitle}</p>
                    </div>
                    <SubmissionBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
