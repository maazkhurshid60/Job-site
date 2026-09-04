import type { Metadata } from "next";
import { listOpenJobs } from "@/lib/server/repo";
import { categoryFacets, stateFacets } from "@/lib/jobTaxonomy";
import { FacetLinks } from "@/components/jobs/LandingJobList";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

/* Hub page. Its real job is crawlability: it gives every discipline page a
   link from a stable URL, so none of them depends on the sitemap alone to
   be discovered.

   Note this sits at /jobs/category, which would otherwise be caught by the
   /jobs/[id] route. Next resolves the static segment first, so this wins —
   but it does mean a job whose id was literally "category" would be
   unreachable. Ids are uuids or te-<uuid>, so that can't happen. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Engineering Jobs by Discipline | JobFolder",
  description: `Browse open engineering, DOT and infrastructure roles by discipline on ${SITE_NAME} — civil, structural, MEP, transportation, CEI inspection and more.`,
  alternates: { canonical: absoluteUrl("/jobs/category") },
};

export default async function CategoryHubPage() {
  const jobs = await listOpenJobs();

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Engineering Jobs by Discipline
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        Every open role on {SITE_NAME}, grouped by the discipline it sits in. Each posting
        shows the fee it pays a recruiter on a confirmed hire.
      </p>

      <FacetLinks title="Disciplines" basePath="/jobs/category" facets={categoryFacets(jobs)} />
      <FacetLinks title="Browse by state" basePath="/jobs/state" facets={stateFacets(jobs)} />
    </main>
  );
}
