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
  StatCard, ProfileMeter, money, HiringPipeline, RecentActivity, OpenRolesForYou,
} from "@/components/dashboard/parts";
import { profileCompletion } from "@/lib/profileCompletion";
import { getMySite, type RecruiterSite } from "@/lib/recruiterSite";
import { OutcomesDonut } from "@/components/dashboard/Charts";
import { Loader } from "@/components/Loader";

export default function DashboardOverview() {
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mySite, setMySite] = useState<RecruiterSite | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([listSubmissionsByRecruiter(), listOpenJobs()])
      .then(([s, jobs]) => {
        setSubs(s);
        setOpenJobs(jobs);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Only fetched once the perk is actually unlocked — no point asking for a
  // site that can't exist yet.
  useEffect(() => {
    if (!user || !profile?.siteBuilderEnabled) return;
    let active = true;
    getMySite()
      .then((site) => active && setMySite(site))
      .catch(() => {}); // non-critical — the banner just won't show
    return () => {
      active = false;
    };
  }, [user, profile?.siteBuilderEnabled]);

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

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            Welcome, {firstName}
          </h1>
          <p className="mt-0.5 text-xs text-muted">Today is {today}</p>
        </div>
        <Link
          href="/dashboard/jobs"
          className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          Browse jobs
        </Link>
      </div>

      {!profile?.verified && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary-soft p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
              <path d="M9 15.5l2 2 4-4" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary">Your account is pending verification</p>
            <p className="mt-0.5 text-xs text-primary/80">
              You can browse and save roles now — submitting a candidate opens up
              once our team has reviewed your account.
            </p>
          </div>
        </div>
      )}

      {!completion.isComplete && (
        <div className="mb-5 rounded-2xl border border-line bg-cream/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink">
                Your profile is {completion.percent}% complete
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {completion.filled} of {completion.total} details added — it&apos;s
                how our recruiters know who they&apos;re working with on your
                referrals.
              </p>
            </div>
            <Link
              href="/dashboard/profile"
              className="shrink-0 rounded-pill border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
            >
              Complete profile
            </Link>
          </div>

          <ProfileMeter percent={completion.percent} className="mt-3" />

          <p className="mt-2.5 text-[11px] text-muted">
            <span className="font-semibold text-ink">Still to add:</span>{" "}
            {/* Only the first few — a list of eight reads as a chore, not a nudge. */}
            {completion.missing.slice(0, 4).map((f) => f.label).join(", ")}
            {completion.missing.length > 4 &&
              ` and ${completion.missing.length - 4} more`}
          </p>
        </div>
      )}

      {/* Site-builder perk: shown once an admin unlocks it, until the site is
          actually live — a delightful bonus, not a blocker, so it sits below
          the verification/profile nudges rather than above them. */}
      {profile?.siteBuilderEnabled && !mySite?.published && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-sage/50 bg-sage-soft p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10h16M10 2c2 2.2 3 5 3 8s-1 5.8-3 8c-2-2.2-3-5-3-8s1-5.8 3-8z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink">
              {mySite ? "Your recruiter website is saved as a draft" : "You've unlocked your free recruiter website"}
            </p>
            <p className="mt-0.5 text-xs text-ink/70">
              {mySite
                ? `Publish it to go live at jobfolder.com/sites/${mySite.slug}.`
                : "Build a one-page site with your story and track record — free, hosted by us."}
            </p>
          </div>
          <Link
            href="/dashboard/career-site"
            className="shrink-0 rounded-pill border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
          >
            {mySite ? "Finish & publish" : "Build your site"}
          </Link>
        </div>
      )}

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Open positions" value={openJobs.length} />
            <StatCard label="Candidates submitted" value={subs.length} />
            <StatCard label="Candidates interviewing" value={interviewing.length} />
            <StatCard label="Placements" value={hired.length} />
          </div>

          {/* pipeline + outcomes */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HiringPipeline subs={subs} />
            </div>
            <OutcomesDonut subs={subs} />
          </div>

          {/* activity + open roles */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <RecentActivity subs={subs} />
            <OpenRolesForYou jobs={openJobs} />
          </div>

          <h2 className="mb-2.5 mt-6 text-xs font-bold uppercase tracking-wide text-muted">
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

          <Link
            href="/dashboard/reports"
            className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-primary"
          >
            <div>
              <p className="text-sm font-bold text-ink">Want the deeper breakdown?</p>
              <p className="mt-0.5 text-xs text-muted">
                Earnings over time, pipeline by stage, and full submission history.
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-primary">View reports →</span>
          </Link>
        </>
      )}
    </div>
  );
}
