import Link from "next/link";
import type { Job } from "@/lib/jobs";
import { formatPay } from "@/components/jobFormat";
import { formatFee } from "@/lib/feeTiers";
import type { Facet } from "@/lib/jobTaxonomy";

/* The body of a category or state landing page.
 *
 * A server component on purpose. /jobs is client-rendered behind filters, so
 * a crawler sees an empty shell until it runs the JavaScript; these pages
 * ship their roles in the HTML, which is the entire reason they exist.
 */

export function LandingJobList({ jobs }: { jobs: Job[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {jobs.map((job) => {
        const fee = formatFee(job.feeTier);
        return (
          <li key={job.id}>
            <Link
              href={`/jobs/${encodeURIComponent(job.id)}`}
              className="group block rounded-xl border border-line bg-white p-5 transition-all hover:border-primary/30 hover:shadow-[0_2px_12px_rgba(23,19,15,0.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-bold leading-snug text-ink transition-colors group-hover:text-primary">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {job.company || "Confidential Client"} &middot; {job.location}
                    {job.remote ? " · Remote" : ""}
                  </p>
                </div>
                {fee && (
                  <span className="shrink-0 rounded-pill bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                    {fee} fee
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag>{job.category}</Tag>
                <Tag>{job.employmentType}</Tag>
                <Tag>{formatPay(job)}</Tag>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill border border-line px-2.5 py-0.5 text-xs font-semibold text-muted">
      {children}
    </span>
  );
}

/* The internal-linking block. Every landing page links to every other one,
   which is what lets a crawler reach all of them from any single entry
   point — without it they'd be orphans that only the sitemap knows about. */
export function FacetLinks({
  title,
  basePath,
  facets,
  activeSlug,
}: {
  title: string;
  basePath: string;
  facets: Facet[];
  activeSlug?: string;
}) {
  const others = facets.filter((f) => f.slug !== activeSlug);
  if (others.length === 0) return null;

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {others.map((f) => (
          <Link
            key={f.slug}
            href={`${basePath}/${f.slug}`}
            className="rounded-pill border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
          >
            {f.name}
            <span className="ml-1.5 text-xs font-medium text-muted">{f.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
