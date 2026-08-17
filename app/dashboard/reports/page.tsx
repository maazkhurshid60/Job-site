"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { listSubmissionsByRecruiter, type Submission } from "@/lib/submissions";
import { feeTierAmount } from "@/lib/feeTiers";
import { HiringPipeline, StatCard, money } from "@/components/dashboard/parts";
import {
  SubmissionsOverTime,
  EarningsOverTime,
  PipelineByStage,
  OutcomesDonut,
} from "@/components/dashboard/Charts";
import { Loader } from "@/components/Loader";

export default function ReportsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listSubmissionsByRecruiter()
      .then(setSubs)
      .finally(() => setLoading(false));
  }, [user]);

  const hired = subs.filter((s) => s.status === "hired");
  const earned = hired.reduce((sum, s) => sum + (feeTierAmount(s.feeTier) ?? 0), 0);
  const winRate = subs.length ? Math.round((hired.length / subs.length) * 100) : 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Reports</h1>
        <p className="mt-0.5 text-xs text-muted">
          How your referrals have performed over time.
        </p>
      </div>

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total earned" value={money(earned)} hint="Fee on confirmed placements" />
            <StatCard label="Candidates submitted" value={subs.length} />
            <StatCard label="Placement rate" value={`${winRate}%`} hint="Hired ÷ submitted" />
          </div>

          <div className="mt-4">
            <HiringPipeline subs={subs} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <SubmissionsOverTime subs={subs} />
            <EarningsOverTime subs={subs} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <PipelineByStage subs={subs} />
            <OutcomesDonut subs={subs} />
          </div>
        </>
      )}
    </div>
  );
}
