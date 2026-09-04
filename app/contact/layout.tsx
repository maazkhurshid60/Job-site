import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Contact Our Engineering Recruiters",
  description:
    "Tell us the engineering, transportation or DOT roles you're hiring for and we'll come back with a plan — usually within one business day. No retainer, no upfront cost.",
  keywords: [
    "contact engineering recruiters",
    "request talent",
    "hire civil engineers",
    "DOT staffing enquiry",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Our Engineering Recruiters",
    description:
      "Tell us the roles you're hiring for and we'll come back with a plan — usually within one business day.",
    url: "/contact",
  },
};

/* Rendered per request, for the same reason as app/jobs: useSearchParams in
   a statically rendered route makes Next skip prerendering down to the
   nearest Suspense boundary, so the server HTML had no <h1> and none of the
   page copy. */
export const dynamic = "force-dynamic";

/* "Ask a question" links from a job detail page pass ?subject=…, which the
   page reads via useSearchParams — that requires a Suspense boundary so the
   rest of the tree can still be prerendered (same pattern as app/jobs). */
export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
