import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecruiterSiteView } from "@/components/site/RecruiterSiteView";
import { getRecruiterSiteBySlug } from "@/lib/server/repo";

/* A recruiter's free one-page site — the /dashboard/career-site perk. Server
   component on purpose, same reasoning as /jobs/[id]: real metadata for
   sharing/SEO, not a client-side fetch. Deliberately outside the (jobs)
   layout group — no JobFolder Navbar/Footer here, this is meant to read as
   the recruiter's own site. */
export const revalidate = 60;

const loadSite = cache((slug: string) => getRecruiterSiteBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await loadSite(slug);
  if (!found) return { title: "Site not found" };

  const { site, recruiter } = found;
  const title = recruiter.name || "Recruiter";
  const description = site.tagline || recruiter.headline || `${title}'s recruiter website.`;

  return {
    title,
    description,
    alternates: { canonical: `/sites/${slug}` },
    openGraph: { type: "profile", title, description, url: `/sites/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function RecruiterSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await loadSite(slug);
  if (!found) notFound();

  // The slug the visitor arrived on — the lead form posts back to it, and
  // the route resolves the owner from it server-side.
  return <RecruiterSiteView site={found.site} recruiter={found.recruiter} leadSlug={slug} />;
}
