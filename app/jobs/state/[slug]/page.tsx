import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { listOpenJobs } from "@/lib/server/repo";
import { categoryFacets, jobsInState, stateFacets, stateOf, titleFromSlug } from "@/lib/jobTaxonomy";
import { LandingJobList, FacetLinks } from "@/components/jobs/LandingJobList";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

/* One indexable page per state, for the "<discipline> jobs <state>" search
   that /jobs alone can never rank for. Same reasoning as the category pages
   next door — see the note there. */
export const revalidate = 3600;

/* Only slugs built from live data are routable; anything else is a real 404.
 *
 * This matters more than it looks. With dynamicParams left on, an unknown
 * slug renders and calls notFound() — but under ISR that response gets
 * cached and served with HTTP 200, i.e. a soft 404. Google treats those as
 * thin duplicates and they quietly eat crawl budget. Switching it off makes
 * the router reject unknown slugs before any of this runs.
 *
 * The trade-off: a discipline or state that gains its first role won't have
 * a page until the next deploy. Its roles are still on /jobs and on the
 * other axis's page, so nothing is hidden — and a deploy follows any sync
 * worth publishing. */
export const dynamicParams = false;

const loadJobs = cache(() => listOpenJobs());

export async function generateStaticParams() {
  const jobs = await loadJobs().catch(() => []);
  return stateFacets(jobs).map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jobs = await loadJobs().catch(() => []);
  const matching = jobsInState(jobs, slug);
  const name = (matching[0] && stateOf(matching[0].location)) || titleFromSlug(slug);

  // Same reasoning as the category page's title.
  const title = `Engineering Jobs in ${name} — ${matching.length} Open Role${matching.length === 1 ? "" : "s"} | JobFolder`;
  const description = `${matching.length} open engineering, DOT and infrastructure role${matching.length === 1 ? "" : "s"} in ${name} on ${SITE_NAME}. Every posting shows the recruiter fee it pays on a confirmed hire.`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/jobs/state/${slug}`) },
    openGraph: { title, description, url: absoluteUrl(`/jobs/state/${slug}`) },
    // See the note on the category page: built, but currently empty.
    ...(matching.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function StateJobsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jobs = await loadJobs();
  const states = stateFacets(jobs);
  const matching = jobsInState(jobs, slug);
  const facet = {
    name: (matching[0] && stateOf(matching[0].location)) || titleFromSlug(slug),
    count: matching.length,
  };

  /* Which disciplines are actually hiring in this state — the most useful
     thing on the page after the roles themselves, and it keeps each state
     page distinct from the others rather than boilerplate with a name
     swapped in. */
  const localCategories = categoryFacets(matching);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <nav className="text-xs font-semibold text-muted" aria-label="Breadcrumb">
        <Link href="/jobs" className="hover:text-primary">All jobs</Link>
        <span className="mx-1.5 opacity-50">/</span>
        <span className="text-ink">{facet.name}</span>
      </nav>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Engineering Jobs in {facet.name}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
        {facet.count} open engineering, DOT and infrastructure{" "}
        {facet.count === 1 ? "role" : "roles"} in {facet.name} on {SITE_NAME}
        {localCategories.length > 0 && (
          <>
            {" "}— currently hiring across{" "}
            {localCategories.slice(0, 4).map((c, i, arr) => (
              <span key={c.slug}>
                {c.name.toLowerCase()}
                {i < arr.length - 2 ? ", " : i === arr.length - 2 ? " and " : ""}
              </span>
            ))}
          </>
        )}
        . Every posting shows the fee it pays a recruiter on a confirmed hire.
      </p>

      <LandingJobList jobs={matching} />

      <FacetLinks
        title="Other states"
        basePath="/jobs/state"
        facets={states}
        activeSlug={slug}
      />
      <FacetLinks
        title="Browse by discipline"
        basePath="/jobs/category"
        facets={categoryFacets(jobs)}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Engineering Jobs in ${facet.name}`,
            url: `${SITE_URL}/jobs/state/${slug}`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: matching.length,
              itemListElement: matching.map((job, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE_URL}/jobs/${encodeURIComponent(job.id)}`,
                name: job.title,
              })),
            },
          }),
        }}
      />
    </main>
  );
}
