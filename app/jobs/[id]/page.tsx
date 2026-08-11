"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { SubmitCandidateForm } from "@/components/dashboard/SubmitCandidateForm";
import { formatPay } from "@/components/jobFormat";
import { getJob, type Job } from "@/lib/jobs";
import { Loader } from "@/components/Loader";
import { JsonLd } from "@/components/JsonLd";
import { jobPostingSchema } from "@/lib/jobSchema";
import { feeTierMeta } from "@/lib/feeTiers";
import { useSavedJobs } from "@/lib/savedJobs";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const { saved, toggle: toggleSaved } = useSavedJobs();

  useEffect(() => {
    let active = true;
    getJob(id)
      // GET /api/jobs/[id] only serves `open` roles; anything else
      // (draft/closed/not found) comes back null and is treated as missing.
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
      {/* Google Jobs eligibility. Emitted only once the role has loaded, since
          the data arrives client-side — see the caveat in lib/jobSchema.ts. */}
      {job && <JsonLd schema={jobPostingSchema(job)} />}
      <Navbar />
      <main className="flex-1 bg-white">
        <Container className="py-12 lg:py-16">
          <Link
            href="/jobs"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← All jobs
          </Link>

          {state === "loading" ? (
            <div className="mt-8 grid h-64 place-items-center rounded-2xl border border-line bg-white">
              <Loader />
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
                  <span className="inline-flex rounded-pill bg-lime/30 px-2.5 py-0.5 text-xs font-semibold text-ink">
                    {job.category}
                  </span>
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

                <div className="mt-6 space-y-6">
                  <Prose title="About the role" text={job.description || "No description provided."} />
                  {job.responsibilities && (
                    <Prose title="Responsibilities" text={job.responsibilities} />
                  )}
                  {job.requirements && (
                    <Prose title="Requirements and skills" text={job.requirements} />
                  )}

                  {job.hiringStages.filter(Boolean).length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-ink">Hiring process</h2>
                      <ol className="mt-3 flex flex-wrap gap-2">
                        {job.hiringStages.filter(Boolean).map((s, i) => (
                          <li key={s + i} className="inline-flex items-center gap-1.5 rounded-pill bg-cream px-3 py-1 text-xs font-medium text-ink">
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {job.faqs.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-ink">FAQs</h2>
                      <div className="mt-3 space-y-3">
                        {job.faqs.map((f, i) => (
                          <div key={i} className="rounded-xl border border-line p-4">
                            <p className="text-sm font-semibold text-ink">{f.question}</p>
                            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-muted">{f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* apply — signed-in recruiters only; the form renders a sign-in prompt otherwise */}
              <div className="lg:sticky lg:top-24 space-y-4">
                {(() => {
                  const tier = feeTierMeta(job.feeTier);
                  if (!tier) return null;
                  return (
                    <div className="rounded-2xl border border-line bg-white p-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Recruiter Opportunity
                      </p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
                        Successful Placement Fee
                      </p>
                      <p className="mt-1 text-4xl font-extrabold tracking-tight text-ink">
                        ${tier.amount.toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Paid when your submitted candidate is successfully hired and
                        all applicable placement conditions are satisfied.
                      </p>

                      <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
                        <div className="flex items-center justify-between">
                          <dt className="text-muted">Position Status</dt>
                          <dd className="font-semibold text-ink">
                            {job.status === "open" ? "Active" : job.status}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-muted">Candidates Submitted</dt>
                          <dd className="font-semibold text-ink">{job.submissionCount ?? 0}</dd>
                        </div>
                      </dl>

                      <div className="mt-5 flex gap-2 border-t border-line pt-4">
                        <button
                          type="button"
                          onClick={() => toggleSaved(job.id)}
                          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-pill border px-3 py-2 text-xs font-semibold transition-colors ${
                            saved.has(job.id)
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-line text-ink hover:bg-black/[0.03]"
                          }`}
                        >
                          <svg width="13" height="13" viewBox="0 0 20 20" fill={saved.has(job.id) ? "currentColor" : "none"} aria-hidden>
                            <path d="M5 3h10v14l-5-3.5L5 17V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          </svg>
                          {saved.has(job.id) ? "Saved" : "Save position"}
                        </button>
                        <Link
                          href={`/contact?subject=${encodeURIComponent(`Question about: ${job.title}`)}`}
                          className="inline-flex flex-1 items-center justify-center rounded-pill border border-line px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-black/[0.03]"
                        >
                          Ask a question
                        </Link>
                      </div>
                    </div>
                  );
                })()}
                <SubmitCandidateForm job={job} />
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Prose({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted">{text}</p>
    </div>
  );
}

