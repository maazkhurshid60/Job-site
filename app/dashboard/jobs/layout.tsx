import { Suspense } from "react";

/* The browse page reads ?q= via useSearchParams, which Next requires to sit
   inside a Suspense boundary — same reasoning as app/jobs/layout.tsx. */
export default function DashboardJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
