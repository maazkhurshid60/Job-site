import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { JobDetailView } from "@/components/JobDetailView";
import { jobPostingSchema } from "@/lib/jobSchema";
import { getOpenJob } from "@/lib/server/repo";

/* Server component on purpose — this is the one page on the site Google Jobs
   actually cares about. Fetching during SSR (rather than the old client
   useEffect) is what makes the <title>/description below and the JobPosting
   JSON-LD reliably eligible for Google Jobs, not just ordinary search. See
   SEO.md's "JobPosting caveat". */
export const revalidate = 300;

/* generateMetadata and the page body both need the job; React's cache()
   dedupes identical calls within one render pass so that's one DB query per
   request, not two. */
const loadJob = cache((id: string) => getOpenJob(id));

function metaDescription(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) return { title: "Role not available" };

  const url = `/jobs/${job.id}`;
  const description = metaDescription(
    job.description || `${job.title} at ${job.company || "a JobFolder client"}.`,
  );

  return {
    title: `${job.title}${job.company ? ` at ${job.company}` : ""}`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title: job.title, description, url },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await loadJob(id);
  if (!job) notFound();

  return (
    <>
      {/* Google Jobs eligibility — rendered server-side now, not injected
          after hydration. */}
      <JsonLd schema={jobPostingSchema(job)} />
      <Navbar />
      <main className="flex-1 bg-white">
        <Container className="py-12 lg:py-16">
          <Link
            href="/jobs"
            className="text-sm font-semibold text-muted hover:text-ink"
          >
            ← All jobs
          </Link>

          <JobDetailView job={job} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
