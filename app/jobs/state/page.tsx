import type { Metadata } from "next";
import { listOpenJobs } from "@/lib/server/repo";
import { categoryFacets, stateFacets } from "@/lib/jobTaxonomy";
import { FacetLinks } from "@/components/jobs/LandingJobList";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

/* Hub page for the state landing pages — see the note in ../category/page.tsx
   for why a static segment under /jobs is safe here. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Engineering Jobs by State",
  description: `Browse open engineering, DOT and infrastructure roles by state on ${SITE_NAME}. Every posting shows the recruiter fee it pays on a confirmed hire.`,
  alternates: { canonical: absoluteUrl("/jobs/state") },
};

export default async function StateHubPage() {
  const jobs = await listOpenJobs();

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Engineering Jobs by State
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        Every open role on {SITE_NAME}, grouped by where it is. Each posting shows the fee it
        pays a recruiter on a confirmed hire.
      </p>

      <FacetLinks title="States" basePath="/jobs/state" facets={stateFacets(jobs)} />
      <FacetLinks title="Browse by discipline" basePath="/jobs/category" facets={categoryFacets(jobs)} />
    </main>
  );
}
