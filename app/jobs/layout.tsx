import type { Metadata } from "next";
import { Suspense } from "react";

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
  return <Suspense>{children}</Suspense>;
}
