"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Container } from "./ui";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { feeTierMeta } from "@/lib/feeTiers";

/* Real, live positions right under the hero — not a hardcoded marketing
   array. If nothing is open yet, the section quietly doesn't render rather
   than show placeholder cards. */
export function OpenPositions() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listOpenJobs()
      .then((all) => {
        // Lead with roles that have a published fee — that's the whole pitch —
        // then fill any remaining slots with the rest, newest first either way.
        const withFee = all.filter((j) => feeTierMeta(j.feeTier));
        const rest = all.filter((j) => !feeTierMeta(j.feeTier));
        setJobs([...withFee, ...rest].slice(0, 6));
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && jobs.length === 0) return null;

  return (
    <section className="bg-cream/50 py-20 lg:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow uppercase tracking-wide">Live on JobFolder</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Real positions. Published fees.
            </h2>
          </div>
          <Link href="/jobs" className="text-sm font-semibold text-primary hover:underline">
            Browse open positions →
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:mt-12">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:mt-12">
            {jobs.map((job) => {
              const tier = feeTierMeta(job.feeTier);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group flex flex-col rounded-2xl border border-line bg-white p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_50px_-30px_rgba(23,19,15,0.35)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{job.category}</p>
                  <h3 className="mt-2.5 text-xl font-bold leading-snug text-ink group-hover:text-primary">
                    {job.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {job.remote ? "Remote" : job.location || "Onsite"}
                    {job.remote && job.location ? ` · ${job.location}` : ""}
                  </p>
                  {tier && (
                    <div className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-pill bg-sage-soft px-3 py-1.5 text-sm font-bold text-ink">
                      Recruiter Fee: ${tier.amount.toLocaleString()}
                    </div>
                  )}
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink group-hover:text-primary">
                    View position
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
