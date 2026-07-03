"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { listOpenJobs, type Job } from "@/lib/jobs";
import { formatPay } from "@/components/jobFormat";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch(() =>
        setError("Could not load roles right now. Please try again shortly."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-cream">
        <Container className="py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow uppercase">Open roles</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">
              Find your next role
            </h1>
            <p className="mt-4 text-muted">
              Every role here is actively hiring through Metro Opportunities. Log
              in to submit your candidates — our team screens every one.
            </p>
          </div>

          <div className="mt-10">
            {loading ? (
              <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-primary" />
              </div>
            ) : error ? (
              <p className="rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
                {error}
              </p>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
                <h2 className="font-bold text-ink">No open roles right now</h2>
                <p className="mt-1 text-sm text-muted">
                  Check back soon — new roles are added regularly.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="group flex flex-col rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-[0_20px_50px_-30px_rgba(23,19,15,0.35)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {job.employmentType}
                      </span>
                      {job.remote && (
                        <span className="inline-flex rounded-pill bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">
                          Remote
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-primary">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {job.company}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-ink">
                      {formatPay(job)}
                    </p>
                    <span className="mt-6 text-sm font-semibold text-primary">
                      View & apply →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
