import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Recruiter Network — Apply",
  description:
    "Apply to join the JobFolder split fee recruiting network. Free to join, no retainers, and the referral commission is published on every role before you submit a candidate.",
  keywords: [
    "join recruiting network",
    "split fee recruiting",
    "freelance recruiter application",
    "recruiter referral commission",
  ],
  alternates: { canonical: "/recruiters/apply" },
  openGraph: {
    title: "Join the Recruiter Network — Apply",
    description:
      "Free to join, no retainers, and every role publishes its referral commission up front.",
    url: "/recruiters/apply",
  },
};

export default function RecruiterApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
