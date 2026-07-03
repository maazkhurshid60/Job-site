"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { SubmitCandidateForm } from "@/components/dashboard/SubmitCandidateForm";
import { formatPay } from "@/components/jobFormat";
import { getJob, type Job } from "@/lib/jobs";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let active = true;
    getJob(id)
      // Firestore rules only expose `open` roles publicly; anything else
      // (draft/closed/not found/permission denied) is treated as missing.
      .then((j) => {
        if (!active) return;
        if (j && j.status === "open") {
          setJob(j);
          setState("ready");
        } else {
          setState("missing");
        }
      })
      .catch(() => active && setState("missing"));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-cream">
        <Container className="py-12 lg:py-16">
          <Link
            href="/jobs"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← All jobs
          </Link>

          {state === "loading" ? (
            <div className="mt-8 grid h-64 place-items-center rounded-2xl border border-line bg-white">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-primary" />
            </div>
          ) : state === "missing" || !job ? (
            <div className="mt-8 rounded-2xl border border-line bg-white p-12 text-center">
              <h1 className="text-lg font-bold text-ink">Role not available</h1>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                This role may have been filled or closed. Browse our other open
                roles instead.
              </p>
              <Link
                href="/jobs"
                className="mt-5 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                View open jobs
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              {/* details */}
              <div className="rounded-2xl border border-line bg-white p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {job.employmentType}
                  </span>
                  {job.remote && (
                    <span className="inline-flex rounded-pill bg-line px-2.5 py-0.5 text-xs font-semibold text-muted">
                      Remote-friendly
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
                  {job.title}
                </h1>
                <p className="mt-2 text-muted">
                  {job.company}
                  {job.location ? ` · ${job.location}` : ""}
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-5 text-sm">
                  <div>
                    <dt className="text-muted">Compensation</dt>
                    <dd className="mt-0.5 font-semibold text-ink">
                      {formatPay(job)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Employment</dt>
                    <dd className="mt-0.5 font-semibold text-ink">
                      {job.employmentType}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <h2 className="text-sm font-bold text-ink">About the role</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">
                    {job.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* apply — login required */}
              <div className="lg:sticky lg:top-24">
                <ApplyPanel job={job} />
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

/* Logged-in users submit a candidate; guests get a login prompt. */
function ApplyPanel({ job }: { job: Job }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-primary" />
      </div>
    );
  }

  if (user) return <SubmitCandidateForm job={job} />;

  return (
    <div className="rounded-2xl border border-line bg-white p-6 text-center">
      <h3 className="text-lg font-bold text-ink">Apply for this role</h3>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        Log in or create an account to submit a candidate for this role.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <Link
          href="/login"
          className="rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Log in to apply
        </Link>
        <Link
          href="/signup"
          className="rounded-pill border border-line px-6 py-3 text-sm font-semibold text-ink hover:bg-black/[0.02]"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
