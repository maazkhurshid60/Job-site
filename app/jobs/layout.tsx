import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Engineering & DOT Jobs — Browse Open Roles",
  description:
    "Browse open civil engineering, transportation and DOT roles across the US — structural, MEP, water resources, CEI inspection and project management. Every listing shows the recruiter fee up front.",
  keywords: [
    "civil engineering jobs",
    "DOT jobs",
    "transportation engineering jobs",
    "CEI inspector jobs",
    "structural engineering jobs",
    "MEP engineering jobs",
    "engineering job board",
  ],
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: "Engineering & DOT Jobs — Browse Open Roles",
    description:
      "Open civil, transportation and DOT engineering roles across the US, with the recruiter fee published on every listing.",
    url: "/jobs",
  },
};

/* The board reads ?q= via useSearchParams, which Next requires to sit inside a
   Suspense boundary so the rest of the tree can still be prerendered. */
export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>{children}</Suspense>

      {/* Outside the boundary on purpose.
          Everything inside it streams in on the client, so the server HTML
          for /jobs is an empty shell — which is the whole reason the landing
          pages exist. Putting these two links in there as well would make
          them just as invisible. Here they are in the initial HTML, giving a
          crawler a path from /jobs to every discipline and state page. */}
      <nav aria-label="Browse jobs by category or location" className="mx-auto max-w-6xl px-6 pb-14">
        <p className="text-sm text-muted">
          Browse roles by{" "}
          <Link href="/jobs/category" className="font-semibold text-primary hover:underline">
            discipline
          </Link>{" "}
          or by{" "}
          <Link href="/jobs/state" className="font-semibold text-primary hover:underline">
            state
          </Link>
          .
        </p>
      </nav>
    </>
  );
}
